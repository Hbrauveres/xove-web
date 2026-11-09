import { expect, test, type Page } from "@playwright/test";
import { blinks, drift } from "../support/frames.ts";
import { observe } from "../support/observe.ts";
import { boxOf } from "../support/geometry.ts";
import { everyoneStops, voiceOn } from "../support/harness.ts";
import { FIXED_TIME, openScene } from "../support/open.ts";
import { pointAt } from "../support/pointer.ts";
import { pictureOf } from "../support/stage.ts";
import { recordCueLooks, ringColours } from "../support/cue.ts";
import { spend, VOICE_LISTEN_MS } from "../support/timing.ts";
import { myButtons, myStream, openSettings, panelOf, tabOf } from "../settings/settings.ts";
import { stageUpFor, watch } from "./below.ts";

/** How far the clock moves on while the duration is watched (ms): from 1:12:40 to 1:13:45. */
const LATER_MS = 65_000;

/** The line under the name: LIVE, what, how long, who's watching. */
const metaOf = (page: Page) => page.getByRole("paragraph").filter({ hasText: "LIVE" });

test("F-now-watching.1 who's on the stage: name, LIVE, what, how long and how many watch", async ({ page }, info) => {
  await openScene(page, "s=live");
  const name = page.getByRole("heading", { name: "Marina", level: 2 });
  const meta = metaOf(page);
  const seen = await observe(page, info, { name, meta }, async () => {
    await page.mouse.move(10, 10);
  });
  await expect.soft(name).toBeVisible();
  await expect.soft(meta).toHaveText("LIVEScreen1:12:403 watching");
  await expect.soft(meta.getByText("LIVE", { exact: true })).toBeVisible();
  // Under the picture, inside the window, starting at its left.
  const pic = await boxOf(pictureOf(page));
  const n = await boxOf(name);
  expect.soft(n.y).toBeGreaterThanOrEqual(pic.y + pic.height);
  expect.soft(n.x).toBeGreaterThanOrEqual(pic.x - 0.5);
  expect.soft(n.x).toBeLessThan(pic.x + pic.width / 2);
  await expect.soft(meta).toBeInViewport({ ratio: 1 });
  expect.soft(blinks(seen.frames, "name")).toEqual([]);
});

test("F-now-watching.2 the duration counts up, nothing beside it moving", async ({ page }, info) => {
  await openScene(page, "s=live");
  const name = page.getByRole("heading", { name: "Marina", level: 2 });
  const meta = metaOf(page);
  const live = meta.getByText("LIVE", { exact: true });
  const seen = await observe(page, info, { name, live, meta }, async () => {
    await page.clock.setFixedTime(new Date(FIXED_TIME.getTime() + LATER_MS));
    await expect(meta).toContainText("1:13:45");
  });
  await expect.soft(meta).toContainText("1:13:45");
  expect.soft(drift(seen.frames, "name")).toBeLessThan(1);
  expect.soft(drift(seen.frames, "live")).toBeLessThan(1);
  expect.soft(blinks(seen.frames, "meta")).toEqual([]);
});

test("F-now-watching.3 pointing at who's watching names them", async ({ page }, info) => {
  await openScene(page, "s=live");
  const watching = page.getByText("3 watching");
  const tip = page.getByRole("tooltip");
  await observe(page, info, { watching, tip }, async () => {
    await pointAt(page, watching);
    await expect(tip).toBeVisible();
  });
  await expect.soft(tip).toHaveText("Henrique, Rafa, Ana");
  // The sharer isn't among them.
  await expect.soft(tip).not.toContainText("Marina");
});

test("F-now-watching.4 what they share, in words", async ({ page }, info) => {
  await openScene(page, "s=facecam");
  const meta = metaOf(page);
  await observe(page, info, { meta }, async () => {
    await page.mouse.move(10, 10);
  });
  await expect.soft(meta).toContainText("Screen with camera");
  await openScene(page, "s=live");
  await watch(page, "Ana · camera");
  await expect.soft(metaOf(page)).toContainText(/^LIVECamera1:35/);
});

test("F-now-watching.5 another stream on the stage changes the row to its sharer", async ({ page }, info) => {
  await openScene(page, "s=live");
  const meta = metaOf(page);
  const seen = await observe(page, info, { meta, heading: page.getByRole("heading", { level: 2 }) }, async () => {
    await page.getByRole("button", { name: "Watch Rafa · screen" }).click();
    await stageUpFor(page, "Rafa");
  });
  await expect.soft(page.getByRole("heading", { name: "Rafa", level: 2 })).toBeVisible();
  await expect.soft(page.getByRole("heading", { name: "Marina", level: 2 })).toHaveCount(0);
  await expect.soft(meta).toHaveText("LIVEScreen38:051 watching");
  expect.soft(drift(seen.frames, "heading")).toBeLessThan(1);
});

test("F-now-watching.6 with nobody live it says so, and who's here", async ({ page }, info) => {
  await openScene(page, "s=live");
  const empty = page.getByRole("heading", { name: "Nobody is sharing yet", level: 2 });
  await observe(page, info, { empty }, async () => {
    await everyoneStops(page);
    await expect(empty).toBeVisible();
  });
  await expect.soft(empty).toBeVisible();
  await expect.soft(page.getByText("Marina, Rafa and Ana are here.")).toBeVisible();
  await expect.soft(page.getByText("LIVE", { exact: true })).toHaveCount(0);
  await expect.soft(page.getByText(/watching/)).toHaveCount(0);
});

test("F-now-watching.7 my face's ring turns green while my voice is sent, red in its silences, never green under my line", async ({
  page,
}, info) => {
  await myStream(page);
  await myButtons(page).voice.click();
  await page.getByRole("button", { name: "Mute your voice" }).waitFor();
  const face = page.locator('[data-ring="inside"]');
  const stop = await recordCueLooks(page, { face }, "::after");
  await observe(page, info, { face }, () => spend(page, VOICE_LISTEN_MS), { strip: 8, gap: 400 });
  const frames = await stop();
  // On or off: the two looks only, the live red and the speaking green.
  const ringColour = await ringColours(page);
  expect.soft(new Set(frames.map((f) => ringColour(f.looks.face!)))).toEqual(new Set(["red", "green"]));
  expect.soft(new Set(frames.map((f) => f.looks.face)).size).toBe(2);
  // My picture at the header's corner never has a ring.
  await expect.soft(page.getByRole("button", { name: /: account/ }).locator("[data-ring]")).toHaveCount(0);
  // My line at the top: nothing of mine is sent, so the ring stays red.
  await openSettings(page);
  await tabOf(page, "Voice").click();
  await panelOf(page).getByRole("slider", { name: "Mic sensitivity" }).press("End");
  await expect(face).not.toHaveAttribute("data-talking");
  const stopQuiet = await recordCueLooks(page, { face }, "::after");
  await spend(page, VOICE_LISTEN_MS / 2);
  expect.soft(new Set((await stopQuiet()).map((f) => ringColour(f.looks.face!)))).toEqual(new Set(["red"]));
});

test("F-now-watching.8 a live face's red ring glows, and someone else's never turns green", async ({ page }, info) => {
  // Marina on the stage, her voice on and talking (heard): her face still only red.
  await openScene(page, "s=live&panel=1");
  await voiceOn(page, 2);
  await page.getByRole("button", { name: "Mute Marina's voice" }).waitFor({ state: "attached" });
  const face = page.locator('[data-ring="inside"]');
  const stop = await recordCueLooks(page, { face }, "::after");
  await observe(page, info, { face }, () => spend(page, VOICE_LISTEN_MS));
  const frames = await stop();
  const ringColour = await ringColours(page);
  expect.soft(new Set(frames.map((f) => ringColour(f.looks.face!)))).toEqual(new Set(["red"]));
  // Its glow: the ring and a soft red inside.
  expect.soft((frames[0]?.looks.face ?? "").match(/inset/g)?.length ?? 0).toBeGreaterThanOrEqual(3);
  // And outside, on the face itself.
  expect.soft(ringColour(await face.evaluate((el) => getComputedStyle(el).boxShadow))).toBe("red");
});

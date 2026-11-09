import { VOICE_LISTEN_MS, spend } from "../support/timing.ts";
import { cueAgainstSound, recordCue, recordCueLooks } from "../support/cue.ts";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { blinks, drift } from "../support/frames.ts";
import { observe } from "../support/observe.ts";
import { boxOf } from "../support/geometry.ts";
import { everyoneStops, togglesStream, voiceOn } from "../support/harness.ts";
import { openScene } from "../support/open.ts";
import { pointAt, pointAway } from "../support/pointer.ts";
import { pictureOf } from "../support/stage.ts";
import { stageUpFor } from "./below.ts";

const previewsOf = (page: Page) => page.getByRole("list", { name: "Other streams" }).getByRole("button");
const placesOf = (page: Page) => page.getByRole("figure");
/** The red ring drawn inside a preview's picture, pointed or open (its own layer). */
const ringOf = (preview: Locator) =>
  preview
    .locator("span")
    .first()
    .evaluate((el) => getComputedStyle(el, "::before").boxShadow);

test("F-also-live.1 the other streams are previews beside the places, the one on the stage left out", async ({
  page,
}, info) => {
  await openScene(page, "s=live");
  const previews = previewsOf(page);
  const places = placesOf(page);
  await observe(page, info, { previews, places }, async () => {
    await page.mouse.move(10, 10);
  });
  await expect.soft(page.getByRole("region", { name: "Also live" })).toBeVisible();
  // The newest sharing first (Ana, 95 s), the longest beside the places (Rafa, 38 min).
  await expect.soft(previews).toHaveText(["Ana · camera", "Rafa · screen"]);
  await expect.soft(page.getByRole("button", { name: "Watch Rafa · screen" })).toBeVisible();
  await expect.soft(page.getByRole("button", { name: "Watch Ana · camera" })).toBeVisible();
  await expect.soft(page.getByRole("button", { name: /Watch Marina/ })).toHaveCount(0);
  // Under the picture, one row: the previews (scrolling where room runs short), then the places,
  // level with them and always whole in the window. Each preview can be scrolled to.
  const pic = await boxOf(pictureOf(page));
  const first = await boxOf(previews.nth(0));
  const second = await boxOf(previews.nth(1));
  const box = await boxOf(places);
  expect.soft(first.y).toBeGreaterThanOrEqual(pic.y + pic.height);
  expect.soft(second.x).toBeGreaterThan(first.x + first.width);
  expect.soft(box.x).toBeGreaterThan(second.x);
  expect.soft(Math.abs(first.y - box.y)).toBeLessThan(1);
  await expect.soft(places).toBeInViewport({ ratio: 1 });
  for (const l of [previews.nth(0), previews.nth(1)]) {
    await l.scrollIntoViewIfNeeded();
    await expect.soft(l).toBeInViewport({ ratio: 1 });
  }
});

test("F-also-live.2 pointing at a preview rings it in red, nothing moving", async ({ page }, info) => {
  await openScene(page, "s=live");
  const rafa = page.getByRole("button", { name: "Watch Rafa · screen" });
  const ana = page.getByRole("button", { name: "Watch Ana · camera" });
  const pill = rafa.getByText("Rafa · screen");
  const atRest = await ringOf(rafa);
  const seen = await observe(page, info, { rafa, ana, pill }, async () => {
    await pointAt(page, rafa);
  });
  const pointed = await ringOf(rafa);
  expect.soft(pointed).not.toEqual(atRest);
  expect.soft(pointed).toContain("inset");
  expect.soft(await ringOf(ana)).toEqual(atRest);
  await expect.soft(rafa).toHaveCSS("cursor", "pointer");
  for (const n of ["rafa", "ana", "pill"]) {
    expect.soft(drift(seen.frames, n)).toBeLessThan(1);
    expect.soft(blinks(seen.frames, n)).toEqual([]);
  }
});

test("F-also-live.3 a click puts that stream on the stage, the one there becomes a preview", async ({ page }, info) => {
  await openScene(page, "s=live");
  const places = placesOf(page);
  const seen = await observe(page, info, { places, previews: previewsOf(page) }, async () => {
    await page.getByRole("button", { name: "Watch Rafa · screen" }).click();
    await stageUpFor(page, "Rafa");
  });
  await expect.soft(page.getByRole("heading", { name: "Rafa", level: 2 })).toBeVisible();
  await expect
    .soft(page.getByRole("region", { name: "Shared screen" }).getByLabel("Rafa's shared screen"))
    .toHaveCount(1);
  await expect.soft(previewsOf(page)).toHaveText(["Ana · camera", "Marina · screen"]);
  await expect.soft(places).toHaveAccessibleName("3 of 6 live, 3 seats open");
  expect.soft(drift(seen.frames, "places")).toBeLessThan(1);
  expect.soft(blinks(seen.frames, "places")).toEqual([]);
});

test("F-also-live.4 with the keyboard, Enter on a preview puts it on the stage", async ({ page }, info) => {
  await openScene(page, "s=live");
  const ana = page.getByRole("button", { name: "Watch Ana · camera" });
  await ana.focus();
  await observe(page, info, { ana }, async () => {
    await page.keyboard.press("Enter");
    await stageUpFor(page, "Ana");
  });
  await expect.soft(page.getByRole("heading", { name: "Ana", level: 2 })).toBeVisible();
  await expect.soft(previewsOf(page)).toHaveText(["Rafa · screen", "Marina · screen"]);
});

test("F-also-live.5 the places show how many are live, and say it when pointed at", async ({ page }, info) => {
  await openScene(page, "s=live");
  const places = placesOf(page);
  const tip = page.getByRole("tooltip");
  await expect.soft(places).toHaveAccessibleName("3 of 6 live, 3 seats open");
  // Six little screens, one lit for each stream live.
  await expect.soft(places.locator("i")).toHaveCount(6);
  await expect.soft(places.locator("i[data-on]")).toHaveCount(3);
  const seen = await observe(page, info, { places, tip }, async () => {
    await pointAt(page, places);
    await expect(tip).toBeVisible();
  });
  await expect.soft(tip).toHaveText("3 of 6 live · 3 seats open");
  expect.soft(drift(seen.frames, "places")).toBeLessThan(1);
});

test("F-also-live.6 with nobody live there are no previews, every place open, the box in its place", async ({
  page,
}, info) => {
  await openScene(page, "s=live");
  const places = placesOf(page);
  const seen = await observe(page, info, { places }, async () => {
    await everyoneStops(page);
    // The room's next poll brings it: the places say it.
    await expect(places).toHaveAccessibleName("0 of 6 live, 6 seats open");
  });
  await expect.soft(previewsOf(page)).toHaveCount(0);
  await expect.soft(places).toHaveAccessibleName("0 of 6 live, 6 seats open");
  await expect.soft(places.locator("i[data-on]")).toHaveCount(0);
  expect.soft(drift(seen.frames, "places")).toBeLessThan(1);
});

test("F-also-live.7 a stream that starts enters at the far end: no preview moves under the pointer", async ({
  page,
}, info) => {
  await openScene(page, "s=live&panel=1");
  const rafa = page.getByRole("button", { name: "Watch Rafa · screen" });
  const ana = page.getByRole("button", { name: "Watch Ana · camera" });
  await pointAt(page, rafa);
  const seen = await observe(page, info, { rafa, ana }, async () => {
    // Bruno starts sharing his screen while the pointer rests on Rafa.
    await togglesStream(page, 5, "screen");
    await page.getByRole("button", { name: "Watch Bruno · screen" }).waitFor();
  });
  await expect.soft(previewsOf(page)).toHaveText(["Bruno · screen", "Ana · camera", "Rafa · screen"]);
  expect.soft(drift(seen.frames, "rafa")).toBeLessThan(1);
  expect.soft(drift(seen.frames, "ana")).toBeLessThan(1);
  // Still Rafa under the pointer.
  const r = await boxOf(rafa);
  const under = await page.evaluate(
    ({ x, y }) => document.elementFromPoint(x, y)?.closest("button")?.getAttribute("aria-label"),
    { x: r.x + r.width / 2, y: r.y + r.height / 2 },
  );
  expect.soft(under).toBe("Watch Rafa · screen");
});

test("F-also-live.8 a preview's ring follows its person's voice: lit while it sounds, out in its silences", async ({
  page,
}, info) => {
  await openScene(page, "s=live&panel=1");
  await voiceOn(page, 3);
  const rafa = page.getByRole("button", { name: "Watch Rafa · screen" });
  const item = rafa.locator("xpath=ancestor::li[1]");
  // A preview's voice plays once I turn it on, from its row; the row then goes (the ring shows with it closed).
  await pointAt(page, rafa);
  await page.getByRole("button", { name: "Unmute Rafa's voice" }).click();
  await pointAway(page);
  await page.getByRole("group", { name: "Rafa's sounds" }).waitFor({ state: "detached" });
  const stop = await recordCue(page, item, "[data-talking]", "user-3");
  // Who's talking is on the picture's line layer (the red ring is its own, above).
  const stopRing = await recordCueLooks(page, { ring: rafa.locator(":scope > span").first() }, "::after");
  await observe(page, info, { rafa }, () => spend(page, VOICE_LISTEN_MS), { strip: 8, gap: 400 });
  const frames = await stop();
  expect.soft(frames.some((f) => f.on) && frames.some((f) => !f.on)).toBe(true);
  expect.soft(cueAgainstSound(frames)).toEqual([]);
  // On or off, never in between: the ring only ever draws its two looks.
  expect.soft(new Set((await stopRing()).map((f) => f.looks.ring)).size).toBe(2);
});

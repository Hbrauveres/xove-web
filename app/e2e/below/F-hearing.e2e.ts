import { expect, test, type Page } from "@playwright/test";
import { blinks, drift } from "../support/frames.ts";
import { observe } from "../support/observe.ts";
import { soundStarts } from "../support/harness.ts";
import { openScene, wakeStage } from "../support/open.ts";
import { pointAt, pointAway } from "../support/pointer.ts";
import { untilStill } from "../support/timing.ts";
import { watch } from "./below.ts";

// Marina's screen comes with its sound (&sound=1); nobody's voice is on in the harness's scenes.

/** What the page plays as sound, apart from the pictures: each one's volume and mute. */
const playing = (page: Page) =>
  page.evaluate(() => [...document.querySelectorAll("audio")].map((a) => ({ volume: a.volume, muted: a.muted })));

/** Marina's preview's row, open. */
async function marinasRow(page: Page) {
  const row = page.getByRole("group", { name: "Marina's sounds" });
  await pointAt(page, page.getByRole("button", { name: /Watch Marina/ }));
  await expect(row).toBeVisible();
  await untilStill(row);
  return row;
}

test("F-hearing.1 the person on the stage is heard", async ({ page }, info) => {
  await openScene(page, "s=live&sound=1");
  const mute = page.getByRole("button", { name: "Mute the screen's sound" });
  await observe(page, info, { mute }, async () => {
    await wakeStage(page);
  });
  await expect.soft(mute).toHaveAttribute("aria-pressed", "false");
  await expect.soft(page.getByRole("slider", { name: "Screen sound volume" })).toHaveValue("1");
  expect.soft(await playing(page)).toEqual([{ volume: 1, muted: false }]);
});

test("F-hearing.2 a small preview isn't heard until I turn it on", async ({ page }, info) => {
  await openScene(page, "s=live&sound=1");
  await observe(page, info, { heading: page.getByRole("heading", { level: 2 }) }, async () => {
    await watch(page, "Rafa · screen");
  });
  const row = await marinasRow(page);
  await expect
    .soft(row.getByRole("button", { name: "Unmute Marina's screen sound" }))
    .toHaveAttribute("aria-pressed", "true");
  // Nothing of hers plays (nor downloads) while she's small and unheard.
  expect.soft(await playing(page)).toEqual([]);
});

test("F-hearing.3 turning a preview's sound on plays it, the stage staying as it is", async ({ page }, info) => {
  await openScene(page, "s=live&sound=1");
  await watch(page, "Rafa · screen");
  const row = await marinasRow(page);
  const button = row.getByRole("button", { name: /Marina's screen sound/ });
  const heading = page.getByRole("heading", { name: "Rafa", level: 2 });
  const seen = await observe(page, info, { button, heading }, async () => {
    await button.click();
    await expect(button).toHaveAccessibleName("Mute Marina's screen sound");
  });
  await expect.soft(button).toHaveAccessibleName("Mute Marina's screen sound");
  await expect.soft(button).toHaveAttribute("aria-pressed", "false");
  expect.soft(await playing(page)).toEqual([{ volume: 1, muted: false }]);
  await expect.soft(heading).toBeVisible();
  expect.soft(drift(seen.frames, "button")).toBeLessThan(1);
  expect.soft(blinks(seen.frames, "button")).toEqual([]);
});

test("F-hearing.4 a preview's volume is that person's, and follows them onto the stage", async ({ page }, info) => {
  await openScene(page, "s=live&sound=1");
  await watch(page, "Rafa · screen");
  const row = await marinasRow(page);
  await row.getByRole("button", { name: "Unmute Marina's screen sound" }).click();
  const slider = row.getByRole("slider", { name: "Marina's screen sound volume" });
  await pointAt(page, row.getByRole("button", { name: "Mute Marina's screen sound" }));
  await expect(slider).toBeVisible();
  await observe(page, info, { slider }, async () => {
    await slider.fill("0.5");
  });
  expect.soft(await playing(page)).toEqual([{ volume: 0.5, muted: false }]);
  await page.keyboard.press("Escape");
  await watch(page, "Marina · screen");
  await wakeStage(page);
  await expect.soft(page.getByRole("slider", { name: "Screen sound volume" })).toHaveValue("0.5");
  await expect.soft(page.getByRole("button", { name: "Mute the screen's sound" })).toBeVisible();
});

test("F-hearing.5 my choice stays with the person, on the stage and off it", async ({ page }, info) => {
  await openScene(page, "s=live&sound=1");
  await watch(page, "Rafa · screen");
  let row = await marinasRow(page);
  await row.getByRole("button", { name: "Unmute Marina's screen sound" }).click();
  await page.keyboard.press("Escape");
  // On the stage and back: still heard while small.
  await watch(page, "Marina · screen");
  await watch(page, "Rafa · screen");
  row = await marinasRow(page);
  await expect.soft(row.getByRole("button", { name: "Mute Marina's screen sound" })).toBeVisible();
  // Muted on the stage: still muted there when she comes back to it.
  await page.keyboard.press("Escape");
  await watch(page, "Marina · screen");
  await wakeStage(page);
  const mute = page.getByRole("button", { name: "Mute the screen's sound" });
  await observe(page, info, { mute }, async () => {
    await mute.click();
  });
  await watch(page, "Rafa · screen");
  await watch(page, "Marina · screen");
  await wakeStage(page);
  await expect
    .soft(page.getByRole("button", { name: /Unmute the screen's sound/ }))
    .toHaveAttribute("aria-pressed", "true");
});

test("F-hearing.6 the first click or key on the page unlocks the room's sound", async ({ page }, info) => {
  // Came in without a click: then a click on nothing that's a sound (the window's left edge).
  await openScene(page, "s=live&sound=1");
  const before = await soundStarts(page);
  const heading = page.getByRole("heading", { name: "Marina", level: 2 });
  await observe(page, info, { heading }, async () => {
    await pointAway(page);
    await page.mouse.down();
    await page.mouse.up();
  });
  await expect.poll(() => soundStarts(page)).toBeGreaterThan(before);
  // A key, in a room entered afresh, does it too.
  await openScene(page, "s=live&sound=1");
  const atKey = await soundStarts(page);
  await page.keyboard.press("Shift");
  await expect.poll(() => soundStarts(page)).toBeGreaterThan(atKey);
  // No sound control was touched: Marina's screen still plays as it did.
  await expect
    .soft(page.getByRole("button", { name: "Mute the screen's sound" }))
    .toHaveAttribute("aria-pressed", "false");
});

// F-unmute: while the browser holds the room's sound back (no click on the page yet), the unmute pill
// takes the sounds' place; any click or key starts the sound and the sound buttons are back.
import { expect, test, type Page } from "@playwright/test";
import { blinks } from "../support/frames.ts";
import { boxOf, inside } from "../support/geometry.ts";
import { pictureWidth, soundStarts } from "../support/harness.ts";
import { observe } from "../support/observe.ts";
import { openScene, wakeStage } from "../support/open.ts";
import { pointAway } from "../support/pointer.ts";
import { shownOpacity } from "../support/screen.ts";
import { chromeOf, control, pictureOf, stageOf } from "../support/stage.ts";
import { spend, untilStill } from "../support/timing.ts";
import { AFTER_POLL } from "../room/room.ts";

/** Marina's screen with its sound, the browser holding the room's sound back. */
const HELD = "s=live&sound=1&held=1";
const unmute = (page: Page) => control(page, "Click to unmute");
const screenSound = (page: Page) => control(page, "Mute the screen's sound");

async function openHeld(page: Page) {
  await openScene(page, HELD);
  await wakeStage(page);
  await unmute(page).waitFor();
}

/** The sound started, the pill gone and the screen's sound back in its place. */
async function expectSoundBack(page: Page, before: number) {
  await expect.poll(() => soundStarts(page)).toBeGreaterThan(before);
  await expect.soft(unmute(page)).toHaveCount(0);
  await expect.soft(screenSound(page)).toBeVisible();
}

test("F-unmute.1 while the browser holds the sound, the unmute pill is in the sounds' place", async ({
  page,
}, info) => {
  await openScene(page, HELD);
  const button = unmute(page);
  const seen = await observe(page, info, { button }, () => wakeStage(page));
  await expect.soft(button).toBeVisible();
  expect.soft(await button.locator('[data-icon="volume-off"]').count()).toBe(1);
  expect.soft(await button.locator("[data-cue]").count()).toBe(1);
  // Red, as the first way.
  const [r, g] = (await button.evaluate((el) => getComputedStyle(el).backgroundColor)).match(/\d+/g)!.map(Number);
  expect.soft(r!).toBeGreaterThan(g! * 2);
  expect.soft(inside(await boxOf(button), await boxOf(pictureOf(page)))).toBe(true);
  await expect.soft(screenSound(page)).toHaveCount(0);
  await expect.soft(control(page, /Marina's voice|Marina's mic is off/)).toHaveCount(0);
  expect.soft(blinks(seen.frames, "button")).toEqual([]);
});

test("F-unmute.2 a click on it starts the sound, and the sound buttons take its place", async ({ page }, info) => {
  await openHeld(page);
  const button = unmute(page);
  const was = await boxOf(button);
  const before = await soundStarts(page);
  const sound = screenSound(page);
  await observe(page, info, { button, sound }, () => button.click());
  await expectSoundBack(page, before);
  // Where the pill began: the bar's left corner.
  expect.soft(Math.abs((await boxOf(sound)).x - was.x)).toBeLessThan(1);
});

test("F-unmute.3 a click anywhere else on the page does the same", async ({ page }, info) => {
  await openHeld(page);
  const before = await soundStarts(page);
  const button = unmute(page);
  await observe(page, info, { button }, async () => {
    await pointAway(page);
    await page.mouse.down();
    await page.mouse.up();
  });
  await expectSoundBack(page, before);
});

test("F-unmute.4 a key does the same", async ({ page }, info) => {
  await openHeld(page);
  const before = await soundStarts(page);
  const button = unmute(page);
  await observe(page, info, { button }, () => page.keyboard.press("Shift"));
  await expectSoundBack(page, before);
});

test("F-unmute.5 once gone, it doesn't come back in that visit", async ({ page }, info) => {
  await openHeld(page);
  const before = await soundStarts(page);
  await unmute(page).click();
  await expectSoundBack(page, before);
  const sound = screenSound(page);
  await observe(page, info, { sound }, async () => {
    // Two of the room's polls go by.
    await spend(page, AFTER_POLL.timeout);
    await wakeStage(page);
  });
  await expect.soft(unmute(page)).toHaveCount(0);
  await expect.soft(sound).toBeVisible();
});

test("F-unmute.6 with the sound allowed it never shows", async ({ page }, info) => {
  await openScene(page, "s=live&sound=1");
  const sound = screenSound(page);
  await observe(page, info, { sound }, () => wakeStage(page));
  await expect.soft(sound).toBeVisible();
  await expect.soft(unmute(page)).toHaveCount(0);
});

test("F-unmute.7 it stays when the controls fade", async ({ page }, info) => {
  await openHeld(page);
  const button = unmute(page);
  const goLive = control(page, "Go live");
  await observe(page, info, { button, goLive }, async () => {
    await page.mouse.move(2, 2);
    await expect(chromeOf(page)).toHaveAttribute("data-chrome", "hidden");
    await untilStill(stageOf(page), { property: "opacity" });
  });
  expect.soft(await shownOpacity(button)).toBeGreaterThan(0.9);
  expect.soft(await shownOpacity(goLive)).toBeLessThan(0.05);
});

test("F-unmute.8 on a narrow picture it keeps the sounds' corner, never folded", async ({ page }, info) => {
  await openHeld(page);
  const button = unmute(page);
  const more = control(page, "More controls");
  await observe(page, info, { button, more }, async () => {
    await pictureWidth(page, 260);
    await wakeStage(page);
  });
  await expect.soft(button).toBeVisible();
  expect.soft(inside(await boxOf(button), await boxOf(pictureOf(page)))).toBe(true);
  await expect.soft(more).toBeVisible();
  await expect.soft(control(page, "Go live")).toHaveCount(0);
});

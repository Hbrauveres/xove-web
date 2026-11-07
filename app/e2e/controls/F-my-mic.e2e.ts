import { expect, test, type Page } from "@playwright/test";
import { blinks, drift } from "../support/frames.ts";
import { observe } from "../support/observe.ts";
import { openScene, wakeStage } from "../support/open.ts";
import { control, openMyStream, pointAt, shownIcons, shownTip } from "./controls.ts";

const mic = (page: Page) => control(page, /your voice/);

/** I go live from Go live, then watch Marina's screen: her stream on the stage, me live. */
async function liveWatchingMarina(page: Page) {
  await openScene(page, "s=live");
  await wakeStage(page);
  await control(page, "Go live").click();
  await page.getByRole("menuitem", { name: "Share your screen" }).click();
  await page.waitForTimeout(2500);
}
async function watchMarina(page: Page) {
  await page.getByRole("button", { name: "Watch Marina · screen" }).click();
  await page.waitForTimeout(1500);
  await wakeStage(page);
}

test("F-my-mic.1 on my stream, a click shares my voice: the mic turns on, red", async ({ page }, info) => {
  await openMyStream(page);
  const button = mic(page);
  await expect.soft(button).toHaveAccessibleName("Share your voice");
  await expect.soft(button).toHaveAttribute("aria-pressed", "false");
  expect.soft(await shownIcons(button)).toEqual(["mic-off"]);
  const before = await button.evaluate((el) => getComputedStyle(el).backgroundColor);
  const seen = await observe(page, info, { button }, async () => {
    await button.click();
    await page.waitForTimeout(1500);
  });
  await expect.soft(button).toHaveAccessibleName("Mute your voice");
  await expect.soft(button).toHaveAttribute("aria-pressed", "true");
  expect.soft(await shownIcons(button)).toEqual(["mic"]);
  // Red while on: its fill changed, and red leads it.
  const after = await button.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect.soft(after).not.toBe(before);
  const [r, g] = after.match(/\d+/g)!.map(Number);
  expect.soft(r!).toBeGreaterThan(g! * 2);
  expect.soft(drift(seen.frames, "button")).toBeLessThan(1);
  expect.soft(blinks(seen.frames, "button")).toEqual([]);
});

test("F-my-mic.2 a second click mutes my voice again", async ({ page }, info) => {
  await openMyStream(page);
  const button = mic(page);
  await button.click();
  await expect.soft(button).toHaveAccessibleName("Mute your voice");
  const seen = await observe(page, info, { button }, async () => {
    await button.click();
    await page.waitForTimeout(800);
  });
  await expect.soft(button).toHaveAccessibleName("Share your voice");
  await expect.soft(button).toHaveAttribute("aria-pressed", "false");
  expect.soft(await shownIcons(button)).toEqual(["mic-off"]);
  expect.soft(drift(seen.frames, "button")).toBeLessThan(1);
  expect.soft(blinks(seen.frames, "button")).toEqual([]);
});

test("F-my-mic.3 pointed at, my mic says what a click does and keeps its icon", async ({ page }, info) => {
  await openMyStream(page);
  const button = mic(page);
  const seen = await observe(page, info, { button }, async () => {
    await pointAt(page, button);
    await page.waitForTimeout(400);
  });
  await expect.soft(shownTip(page)).toHaveText("Share your voice");
  expect.soft(await shownIcons(button)).toEqual(["mic-off"]);
  expect.soft(blinks(seen.frames, "button")).toEqual([]);
});

test("F-my-mic.4 over someone else's stream while I'm live, my mic takes Go live's place", async ({ page }, info) => {
  await liveWatchingMarina(page);
  const button = mic(page);
  await observe(page, info, { button }, () => watchMarina(page));
  await expect
    .soft(control(page, "Mute the screen's sound").or(control(page, "No sound in this stream")))
    .toBeVisible();
  await expect.soft(control(page, "Go live")).toHaveCount(0);
  await expect.soft(button).toHaveAccessibleName("Share your voice");
  await expect.soft(button).toHaveAttribute("aria-pressed", "false");
  // M 34 there, as the bar's other buttons.
  const b = await button.boundingBox();
  expect.soft(Math.round(b?.width ?? 0)).toBe(34);
  await button.click();
  await expect.soft(button).toHaveAccessibleName("Mute your voice");
  await expect.soft(button).toHaveAttribute("aria-pressed", "true");
});

test("F-my-mic.5 my voice is one switch: turned on in my row, it's on over someone else's stream", async ({
  page,
}, info) => {
  await liveWatchingMarina(page);
  await wakeStage(page);
  await mic(page).click();
  await expect.soft(mic(page)).toHaveAccessibleName("Mute your voice");
  const button = mic(page);
  await observe(page, info, { button }, () => watchMarina(page));
  await expect.soft(button).toHaveAccessibleName("Mute your voice");
  await expect.soft(button).toHaveAttribute("aria-pressed", "true");
  expect.soft(await shownIcons(button)).toEqual(["mic"]);
});

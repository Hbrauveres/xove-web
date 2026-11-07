import { expect, test, type Locator, type Page } from "@playwright/test";
import { blinks, drift } from "../support/frames.ts";
import { observe } from "../support/observe.ts";
import { openScene, wakeStage } from "../support/open.ts";
import { boxOf, inside } from "../support/geometry.ts";
import { clickAt, restOn, tabTo } from "../support/pointer.ts";
import { shownOpacity } from "../support/screen.ts";
import { chromeOf, control, pictureOf, shownTip, stageOf } from "../support/stage.ts";
import { HOVER_REST_MS, REST_MS, untilStill } from "../support/timing.ts";
import { middleY, openWithVoice, shownIcons, sliderOpen } from "./controls.ts";

/** Whether the picture's box holds the control's whole box. */
const onPicture = async (page: Page, target: Locator) => inside(await boxOf(target), await boxOf(pictureOf(page)));

test("F-viewer-bar.1 over someone else's stream, their sounds at the left and Go live at the right, level with fullscreen", async ({
  page,
}, info) => {
  await openScene(page, "s=live&sound=1");
  const sound = control(page, "Mute the screen's sound");
  const voice = control(page, "Marina's mic is off");
  const goLive = control(page, "Go live");
  const full = control(page, "Fullscreen");
  const seen = await observe(page, info, { sound, voice, goLive, full }, () => wakeStage(page));
  for (const c of [sound, voice, goLive, full]) {
    await expect.soft(c).toBeVisible();
    expect.soft(await onPicture(page, c)).toBe(true);
    expect.soft(Math.abs((await middleY(c)) - (await middleY(full)))).toBeLessThan(1);
  }
  await expect.soft(sound).toHaveAttribute("aria-pressed", "false");
  const [s, v, g, f] = await Promise.all([sound, voice, goLive, full].map(boxOf));
  expect.soft(s!.x).toBeLessThan(v!.x);
  expect.soft(v!.x + v!.width).toBeLessThan(g!.x);
  expect.soft(g!.x + g!.width).toBeLessThanOrEqual(f!.x);
  // Over someone else's stream, none of my own stream's round buttons.
  await expect.soft(control(page, "Share your screen")).toHaveCount(0);
  await expect.soft(control(page, "Settings")).toHaveCount(0);
  expect.soft(seen.after.sound?.visible).toBe(true);
});

test("F-viewer-bar.2 a click mutes the screen's sound and a second unmutes it", async ({ page }, info) => {
  await openScene(page, "s=live&sound=1");
  await wakeStage(page);
  const sound = control(page, /the screen's sound/);
  expect.soft(await shownIcons(sound)).toEqual(["sound"]);
  const seen = await observe(page, info, { sound }, async () => {
    await sound.click();
  });
  await expect.soft(sound).toHaveAccessibleName("Unmute the screen's sound");
  await expect.soft(sound).toHaveAttribute("aria-pressed", "true");
  expect.soft(await shownIcons(sound)).toEqual(["volume-off"]);
  expect.soft(blinks(seen.frames, "sound")).toEqual([]);
  expect.soft(drift(seen.frames, "sound")).toBeLessThan(1);
  await sound.click();
  await expect.soft(sound).toHaveAccessibleName("Mute the screen's sound");
  await expect.soft(sound).toHaveAttribute("aria-pressed", "false");
  expect.soft(await shownIcons(sound)).toEqual(["sound"]);
});

test("F-viewer-bar.3 resting on a sound unrolls its own slider over it, and leaving closes it", async ({
  page,
}, info) => {
  await openScene(page, "s=live&sound=1");
  await wakeStage(page);
  const sound = control(page, "Mute the screen's sound");
  const slider = page.getByLabel("Screen sound volume");
  expect.soft(await sliderOpen(slider)).toBe(false);
  const seen = await observe(page, info, { sound, slider }, async () => {
    await restOn(page, sound, REST_MS);
    await expect.poll(() => sliderOpen(slider)).toBe(true);
  });
  expect.soft(await sliderOpen(slider)).toBe(true);
  const s = await boxOf(sound);
  const r = await boxOf(slider.locator("xpath=.."));
  // Upright, above its button, centred on it.
  expect.soft(r.y + r.height).toBeLessThanOrEqual(s.y);
  expect.soft(Math.abs(r.x + r.width / 2 - (s.x + s.width / 2))).toBeLessThan(1);
  expect.soft(drift(seen.frames, "sound")).toBeLessThan(1);
  expect.soft(blinks(seen.frames, "sound")).toEqual([]);
  // The mouse leaves: a moment later (300 ms) the slider rolls back.
  const stage = await boxOf(pictureOf(page));
  await page.mouse.move(stage.x + stage.width / 2, stage.y + stage.height / 3, { steps: 4 });
  await expect.poll(() => sliderOpen(slider)).toBe(false);
  await untilStill(stageOf(page), { property: "opacity" });
  expect.soft(await sliderOpen(slider)).toBe(false);
});

test("F-viewer-bar.4 the keyboard's focus opens a sound's slider and Enter mutes it", async ({ page }, info) => {
  await openScene(page, "s=live&sound=1");
  await wakeStage(page);
  const sound = control(page, /the screen's sound/);
  const slider = page.getByLabel("Screen sound volume");
  const seen = await observe(page, info, { sound }, async () => {
    await tabTo(page, sound);
    await expect.poll(() => sliderOpen(slider)).toBe(true);
  });
  expect.soft(await sliderOpen(slider)).toBe(true);
  // Focus from the keyboard shows the red ring: the controls don't fade while it's there.
  expect.soft(await shownOpacity(sound)).toBeGreaterThan(0.9);
  await page.keyboard.press("Enter");
  await expect.soft(sound).toHaveAccessibleName("Unmute the screen's sound");
  await expect.soft(sound).toHaveAttribute("aria-pressed", "true");
  // A change keeps the slider open: its range shows muted, still there.
  expect.soft(await sliderOpen(slider)).toBe(true);
  expect.soft(seen.after.sound?.visible).toBe(true);
});

test("F-viewer-bar.5 a sound that can't be heard is greyed and says why", async ({ page }, info) => {
  await openScene(page, "s=live");
  await wakeStage(page);
  const sound = control(page, "No sound in this stream");
  const voice = control(page, "Marina's mic is off");
  await expect.soft(sound).toHaveAttribute("aria-disabled", "true");
  await expect.soft(voice).toHaveAttribute("aria-disabled", "true");
  expect.soft(await shownIcons(sound)).toEqual(["volume-off"]);
  expect.soft(await shownIcons(voice)).toEqual(["voice-off"]);
  expect.soft(await shownOpacity(voice)).toBeLessThan(0.6);
  const seen = await observe(page, info, { voice }, async () => {
    await restOn(page, voice, HOVER_REST_MS);
    await shownTip(page).waitFor();
  });
  // Pointed at, its tooltip says why; no slider unrolls.
  await expect.soft(shownTip(page)).toHaveText("Marina's mic is off");
  await expect.soft(page.getByLabel("Marina's voice volume")).toHaveCount(0);
  // A click says why in the toast, and changes nothing.
  await clickAt(page, voice);
  await expect.soft(page.locator("output[aria-live]")).toContainText("Marina's mic is off");
  await expect.soft(voice).toHaveAccessibleName("Marina's mic is off");
  expect.soft(blinks(seen.frames, "voice")).toEqual([]);
});

test("F-viewer-bar.6 a heard voice stays when the controls fade, the rest fade away", async ({ page }, info) => {
  await openWithVoice(page, "&sound=1");
  const voice = control(page, "Mute Marina's voice");
  const sound = control(page, "Mute the screen's sound");
  const goLive = control(page, "Go live");
  await expect.soft(voice).toBeVisible();
  expect.soft(await shownIcons(voice)).toEqual(["voice"]);
  const seen = await observe(
    page,
    info,
    { voice, sound, goLive },
    async () => {
      // Out of the stage: the controls fade.
      await page.mouse.move(2, 2);
      await expect(chromeOf(page)).toHaveAttribute("data-chrome", "hidden");
      await untilStill(stageOf(page), { property: "opacity" });
    },
    { strip: 10, gap: 350 },
  );
  await expect.soft(chromeOf(page)).toHaveAttribute("data-chrome", "hidden");
  expect.soft(await shownOpacity(voice)).toBeGreaterThan(0.9);
  expect.soft(await shownOpacity(sound)).toBeLessThan(0.05);
  expect.soft(await shownOpacity(goLive)).toBeLessThan(0.05);
  // The voice takes the sound's place, alone in the corner: still inside the picture.
  expect.soft(await onPicture(page, voice)).toBe(true);
  expect.soft(blinks(seen.frames, "voice")).toEqual([]);
});

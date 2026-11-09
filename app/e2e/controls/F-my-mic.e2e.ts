import { expect, test, type Page } from "@playwright/test";
import { blinks, drift } from "../support/frames.ts";
import { observe } from "../support/observe.ts";
import { openScene, wakeStage } from "../support/open.ts";
import { boxOf } from "../support/geometry.ts";
import { pxOf, SIZE } from "../support/looks.ts";
import { restOn } from "../support/pointer.ts";
import { control, shownTip, stageOf } from "../support/stage.ts";
import { recordCueLooks, ringColour } from "../support/cue.ts";
import { TIP_REST_MS, VOICE_LISTEN_MS, spend, untilStill } from "../support/timing.ts";
import { openMyStream, shownIcons } from "./controls.ts";

const mic = (page: Page) => control(page, /your voice/);

/** I go live from Go live, then watch Marina's screen: her stream on the stage, me live. */
async function liveWatchingMarina(page: Page) {
  await openScene(page, "s=live");
  await wakeStage(page);
  await control(page, "Go live").click();
  await page.getByRole("menuitem", { name: "Share your screen" }).click();
  await control(page, "Stop sharing your screen").waitFor({ state: "attached" });
  await untilStill(page);
}
async function watchMarina(page: Page) {
  await page.getByRole("button", { name: "Watch Marina · screen" }).click();
  await stageOf(page).getByLabel("Marina's shared screen").waitFor();
  await untilStill(page);
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
    await expect(button).toHaveAccessibleName("Mute your voice");
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
    await expect(button).toHaveAccessibleName("Share your voice");
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
    await restOn(page, button, TIP_REST_MS);
    await shownTip(page).waitFor();
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
  expect.soft(Math.round((await boxOf(button)).width)).toBe(await pxOf(page, SIZE.buttonM));
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

test("F-my-mic.6 while my voice is sent, my mic wears no cue: my face under the stage lights instead", async ({
  page,
}, info) => {
  // My own stream, my voice on (the harness's mic talks in phrases).
  await openMyStream(page);
  await mic(page).click();
  await expect(mic(page)).toHaveAccessibleName("Mute your voice");
  const button = mic(page);
  const face = page.locator('[data-ring="inside"]');
  const stop = await recordCueLooks(page, { mic: button, face: { at: face, layer: "::after" } });
  await restOn(page, control(page, "Fullscreen"), TIP_REST_MS);
  await observe(page, info, { button, face }, () => spend(page, VOICE_LISTEN_MS), { strip: 8, gap: 400 });
  const frames = await stop();
  // My mic never draws the cue; my face switches between the live red and the speaking green.
  expect.soft(new Set(frames.map((f) => f.looks.mic))).toEqual(new Set(["none"]));
  await expect.soft(button).not.toHaveAttribute("data-cue");
  const colours = new Set(frames.map((f) => ringColour(f.looks.face!)));
  expect.soft(colours).toEqual(new Set(["red", "green"]));
  expect.soft(await shownIcons(button)).toEqual(["mic"]);
});

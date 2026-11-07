import { expect, test, type Page } from "@playwright/test";
import { blinks, drift } from "../support/frames.ts";
import { observe } from "../support/observe.ts";
import { boxOf, centreX, inside, overlap, windowBox } from "../support/geometry.ts";
import { pxOf } from "../support/looks.ts";
import { openScene, wakeStage } from "../support/open.ts";
import { pointAt, restOn, tabTo } from "../support/pointer.ts";
import { shownTip, stageOf } from "../support/stage.ts";
import { FRAME_MS, REST_MS, TIP_REST_MS, untilStill } from "../support/timing.ts";
import { GAP } from "../../src/shared/components/tooltip/constants/tooltip.constants.ts";

/** "At once": the tooltip gone by the next look, well before any rest. */
const AT_ONCE = { timeout: 50 };
/** Well under the tooltip's rest: a tooltip shown in this time didn't wait for one. */
const UNDER_THE_REST = { timeout: (TIP_REST_MS * 2) / 3 };

/** The tooltip that says `text`, shown or not. */
// Hidden tooltips stay in the page (to describe their control): found by role, shown or not.
const tipOf = (page: Page, text: string) =>
  page.locator('[role="tooltip"]').filter({ hasText: new RegExp(`^${text}$`) });
const button = (page: Page, name: string) => page.getByRole("button", { name, exact: true });

test("F-floating.1 a tooltip shows after a short rest, above its control, inside the window", async ({
  page,
}, info) => {
  await openScene(page, "s=live");
  await wakeStage(page);
  const fullscreen = button(page, "Fullscreen");
  const tip = tipOf(page, "Fullscreen");
  const seen = await observe(page, info, { fullscreen, tip }, async () => {
    await pointAt(page, fullscreen);
    await expect(tip).toBeVisible();
  });
  await expect.soft(tip).toHaveAttribute("data-shown", "true");
  await expect.soft(tip).toBeVisible();
  await expect.soft(shownTip(page)).toHaveCount(1);
  const t = await boxOf(tip);
  const b = await boxOf(fullscreen);
  expect.soft(inside(t, windowBox(page))).toBe(true);
  expect.soft(overlap(t, b)).toBe(false);
  // Its gap above its control, centred over it unless the window's edge is too close.
  expect.soft(Math.abs(b.y - (t.y + t.height) - GAP)).toBeLessThan(1);
  expect.soft(t.width).toBeLessThanOrEqual((await pxOf(page, "var(--tooltip-width)")) + 0.5);
  // Not at once: the rest comes first, so the first frames have no tooltip.
  const shownAt = seen.frames.findIndex((f) => (f.seen.tip?.opacity ?? 0) > 0.05);
  const firstT = seen.frames[0]?.t ?? 0;
  expect.soft(shownAt).toBeGreaterThan(0);
  expect.soft((seen.frames[shownAt]?.t ?? 0) - firstT).toBeGreaterThanOrEqual(TIP_REST_MS - FRAME_MS);
  expect.soft(drift(seen.frames, "fullscreen")).toBeLessThan(1);
});

test("F-floating.2 the pointer leaving or pressing hides the tooltip at once", async ({ page }, info) => {
  await openScene(page, "s=live");
  await wakeStage(page);
  const fullscreen = button(page, "Fullscreen");
  const tip = tipOf(page, "Fullscreen");
  await pointAt(page, fullscreen);
  await expect(tip).toHaveAttribute("data-shown", "true");
  const stage = await boxOf(stageOf(page));
  await observe(page, info, { fullscreen, tip }, async () => {
    await page.mouse.move(centreX(stage), stage.y + 200);
  });
  await expect.soft(tip).not.toHaveAttribute("data-shown", AT_ONCE);
  await expect.soft(shownTip(page)).toHaveCount(0);
  // Back on it, then a press: gone as well, the button still there.
  await pointAt(page, fullscreen);
  await expect(tip).toHaveAttribute("data-shown", "true");
  await page.mouse.down();
  await expect.soft(tip).not.toHaveAttribute("data-shown", AT_ONCE);
  await page.mouse.up();
  await expect.soft(fullscreen).toBeVisible();
});

test("F-floating.3 along a row, the next tooltip shows at once and replaces the last", async ({ page }, info) => {
  await openScene(page, "s=live");
  await wakeStage(page);
  const sound = button(page, "No sound in this stream");
  const mic = button(page, "Marina's mic is off");
  const soundTip = tipOf(page, "No sound in this stream");
  const micTip = tipOf(page, "Marina's mic is off");
  await pointAt(page, sound);
  await expect(soundTip).toHaveAttribute("data-shown", "true");
  const seen = await observe(page, info, { sound, mic, soundTip, micTip }, async () => {
    await pointAt(page, mic, { steps: 2 });
    // Well under the rest: shown already.
    await expect(micTip).toHaveAttribute("data-shown", "true", UNDER_THE_REST);
  });
  await expect.soft(micTip).toHaveAttribute("data-shown", "true");
  await expect.soft(soundTip).not.toHaveAttribute("data-shown");
  await expect.soft(shownTip(page)).toHaveCount(1);
  expect.soft(drift(seen.frames, "sound")).toBeLessThan(1);
  expect.soft(drift(seen.frames, "mic")).toBeLessThan(1);
});

test("F-floating.4 the keyboard's focus shows the tooltip, leaving it hides it", async ({ page }, info) => {
  await openScene(page, "s=live");
  await wakeStage(page);
  const fullscreen = button(page, "Fullscreen");
  const tip = tipOf(page, "Fullscreen");
  await observe(page, info, { fullscreen, tip }, () => tabTo(page, fullscreen, 30));
  await expect.soft(fullscreen).toBeFocused();
  await expect.soft(tip).toHaveAttribute("data-shown", "true");
  await page.keyboard.press("Tab");
  await expect.soft(tip).not.toHaveAttribute("data-shown");
});

test("F-floating.5 what I opened stays when a tooltip shows elsewhere", async ({ page }, info) => {
  await openScene(page, "s=live");
  await wakeStage(page);
  const goLive = button(page, "Go live");
  await goLive.click();
  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  const fullscreen = button(page, "Fullscreen");
  const tip = tipOf(page, "Fullscreen");
  const seen = await observe(page, info, { menu, tip, goLive }, async () => {
    await pointAt(page, fullscreen);
    await expect(tip).toBeVisible();
  });
  await expect.soft(tip).toHaveAttribute("data-shown", "true");
  await expect.soft(menu).toBeVisible();
  await expect.soft(goLive).toHaveAttribute("aria-expanded", "true");
  expect.soft(blinks(seen.frames, "menu")).toEqual([]);
});

test("F-floating.6 opening one thing closes what was open: one at a time", async ({ page }, info) => {
  await openScene(page, "s=live");
  await wakeStage(page);
  const goLive = button(page, "Go live");
  await goLive.click();
  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  const activity = page.getByRole("button", { name: /^Activity/ });
  const panel = page.getByRole("dialog", { name: "Activity" });
  await observe(page, info, { menu, activity, panel }, async () => {
    await activity.click();
  });
  await expect.soft(panel).toBeVisible();
  await expect.soft(menu).toHaveCount(0);
  await expect.soft(goLive).toHaveAttribute("aria-expanded", "false");
});

test("F-floating.7 Escape closes what's open and gives the focus back to its button", async ({ page }, info) => {
  await openScene(page, "s=live");
  const activity = page.getByRole("button", { name: /^Activity/ });
  await activity.click();
  const panel = page.getByRole("dialog", { name: "Activity" });
  await expect(panel).toBeVisible();
  await observe(page, info, { activity, panel }, async () => {
    await page.keyboard.press("Escape");
  });
  await expect.soft(panel).toHaveCount(0);
  await expect.soft(activity).toHaveAttribute("aria-expanded", "false");
  await expect.soft(activity).toBeFocused();
});

test("F-floating.8 a mouse rest never unrolls over what I opened", async ({ page }, info) => {
  await openScene(page, "s=live&sound=1");
  await wakeStage(page);
  const activity = page.getByRole("button", { name: /^Activity/ });
  await activity.click();
  const panel = page.getByRole("dialog", { name: "Activity" });
  await expect(panel).toBeVisible();
  const sound = button(page, "Mute the screen's sound");
  const slider = page.getByRole("slider", { name: "Screen sound volume" });
  // A rest as long as the slider's, and what it would start over: then it'd be unrolling.
  const seen = await observe(page, info, { panel, sound, slider }, async () => {
    await restOn(page, sound, REST_MS);
    await untilStill(page);
  });
  await expect.soft(panel).toBeVisible();
  // The slider's drawer stays rolled up (it unrolls with data-open).
  await expect.soft(slider.locator("xpath=..")).not.toHaveAttribute("data-open");
  // Once the panel is closed, the same rest unrolls it: the rest itself works.
  await page.keyboard.press("Escape");
  await pointAt(page, page.getByRole("button", { name: /^Go live/ }));
  await pointAt(page, sound);
  await expect.soft(slider.locator("xpath=..")).toHaveAttribute("data-open", "true");
  expect.soft(blinks(seen.frames, "panel")).toEqual([]);
});

import { expect, test, type Page } from "@playwright/test";
import { blinks, drift } from "../support/frames.ts";
import { observe } from "../support/observe.ts";
import { openScene, wakeStage } from "../support/open.ts";
import { boxOf, inside, windowBox } from "../support/geometry.ts";
import { everyoneStops } from "../support/harness.ts";
import { restOn } from "../support/pointer.ts";
import { shownTip } from "../support/stage.ts";
import { TIP_REST_MS, untilStill } from "../support/timing.ts";
import { shownControls, stageParts, TALL } from "./stage.ts";

/** What's fullscreen now: nothing, or the stage's frame (the player). */
const fullscreenIsStage = (page: Page) =>
  page.evaluate(() => {
    const el = document.fullscreenElement;
    const box = document.querySelector('section[aria-label="Shared screen"] > div');
    return el !== null && el.parentElement === box;
  });
const anythingFullscreen = (page: Page) => page.evaluate(() => document.fullscreenElement !== null);

/** Waits until the page is in fullscreen (`on`) or out of it, and still. */
async function fullscreenNow(page: Page, on: boolean): Promise<void> {
  await expect.poll(() => anythingFullscreen(page)).toBe(on);
  await untilStill(page);
}

async function goFullscreen(page: Page): Promise<void> {
  await wakeStage(page);
  await page.getByRole("button", { name: "Fullscreen" }).click();
  await fullscreenNow(page, true);
  await wakeStage(page);
}

/** How near its button a tooltip sits (px): centred over it, a small gap above (more if kept in the window). */
const TIP_NEAR = 40;

test("F-fullscreen.1 pointing at the fullscreen button says Fullscreen, and nothing moves", async ({ page }, info) => {
  await openScene(page, "s=live");
  await wakeStage(page);
  const button = page.getByRole("button", { name: "Fullscreen" });
  const tip = shownTip(page);
  const seen = await observe(page, info, { button, tip }, async () => {
    await restOn(page, button, TIP_REST_MS);
    await tip.waitFor();
  });
  await expect.soft(tip).toHaveText("Fullscreen");
  const t = await boxOf(tip);
  const b = await boxOf(button);
  expect.soft(t.y + t.height).toBeLessThanOrEqual(b.y);
  expect.soft(drift(seen.frames, "button")).toBeLessThan(1);
  expect.soft(blinks(seen.frames, "button")).toEqual([]);
});

test("F-fullscreen.2 a click puts the whole player fullscreen, its button now Exit fullscreen", async ({
  page,
}, info) => {
  await openScene(page, "s=live");
  await wakeStage(page);
  const stage = stageParts(page);
  const enter = page.getByRole("button", { name: "Fullscreen" });
  await observe(page, info, { view: stage.view, enter }, async () => {
    await enter.click();
    await fullscreenNow(page, true);
  });
  await wakeStage(page);
  expect.soft(await fullscreenIsStage(page)).toBe(true);
  await expect.soft(page.getByRole("button", { name: "Exit fullscreen" })).toBeVisible();
  const view = await boxOf(stage.view);
  const screen = windowBox(page);
  // A wide picture fills the screen's width.
  expect.soft(Math.abs(view.width - screen.width)).toBeLessThan(1);
  await expect.soft(stage.box.getByLabel("Marina's shared screen")).toBeVisible();
  const outside = (await shownControls(page)).filter((c) => !inside(c.box, view)).map((c) => c.name);
  expect.soft(outside).toEqual([]);
});

test("F-fullscreen.3 fullscreen, a tall picture fills the screen's height with its controls on it", async ({
  page,
}, info) => {
  await openScene(page, "s=portrait");
  const stage = stageParts(page);
  await observe(page, info, { view: stage.view }, () => goFullscreen(page));
  await wakeStage(page);
  const view = await boxOf(stage.view);
  const screen = windowBox(page);
  expect.soft(Math.abs(view.height - screen.height)).toBeLessThan(1);
  // Its own shape (9:16), as wide as the screen's height allows: on a monitor on its side, the
  // whole width.
  expect.soft(Math.abs(view.width - Math.min(screen.width, screen.height * TALL))).toBeLessThan(1);
  const controls = await shownControls(page);
  expect.soft(controls.length).toBeGreaterThan(1);
  expect.soft(controls.filter((c) => !inside(c.box, view)).map((c) => c.name)).toEqual([]);
});

test("F-fullscreen.4 Exit fullscreen brings the stage back to its place on the page", async ({ page }, info) => {
  await openScene(page, "s=live");
  const stage = stageParts(page);
  const before = await boxOf(stage.box);
  await goFullscreen(page);
  const exit = page.getByRole("button", { name: "Exit fullscreen" });
  await observe(page, info, { box: stage.box, exit }, async () => {
    await exit.click();
    await fullscreenNow(page, false);
  });
  expect.soft(await anythingFullscreen(page)).toBe(false);
  await expect.soft(page.getByRole("button", { name: "Fullscreen" })).toHaveCount(1);
  const after = await boxOf(stage.box);
  expect.soft(Math.abs(after.x - before.x) + Math.abs(after.y - before.y)).toBeLessThan(1);
  expect.soft(Math.abs(after.width - before.width) + Math.abs(after.height - before.height)).toBeLessThan(1);
});

test("F-fullscreen.5 leaving by the browser's own way (Escape) is followed by the button", async ({ page }, info) => {
  await openScene(page, "s=live");
  await goFullscreen(page);
  const button = page.getByRole("button", { name: /fullscreen/i });
  await observe(page, info, { button }, async () => {
    // What the browser does on Escape: the page can't press the browser's own key.
    await page.evaluate(() => document.exitFullscreen());
    await fullscreenNow(page, false);
  });
  expect.soft(await anythingFullscreen(page)).toBe(false);
  await expect.soft(page.getByRole("button", { name: "Fullscreen" })).toHaveCount(1);
  await expect.soft(page.getByRole("button", { name: "Exit fullscreen" })).toHaveCount(0);
});

test("F-fullscreen.6 with the keyboard, Enter on the focused button goes fullscreen", async ({ page }, info) => {
  await openScene(page, "s=live");
  const button = page.getByRole("button", { name: "Fullscreen" });
  await observe(page, info, { button }, async () => {
    await button.focus();
    await page.keyboard.press("Enter");
    await fullscreenNow(page, true);
  });
  expect.soft(await fullscreenIsStage(page)).toBe(true);
  // The focus stays on the button, now Exit fullscreen.
  const exit = page.getByRole("button", { name: "Exit fullscreen" });
  await expect.soft(exit).toBeFocused();
  // Its tooltip, focused, sits just above it: not left where the button was before fullscreen.
  const tip = shownTip(page).filter({ hasText: "Exit fullscreen" });
  await expect.soft(tip).toBeVisible();
  const b = await boxOf(exit);
  const t = await boxOf(tip);
  expect.soft(Math.abs(t.x + t.width / 2 - (b.x + b.width / 2))).toBeLessThan(TIP_NEAR);
  expect.soft(b.y - (t.y + t.height)).toBeGreaterThanOrEqual(0);
  expect.soft(b.y - (t.y + t.height)).toBeLessThan(TIP_NEAR);
});

test("F-fullscreen.7 when everyone stops in fullscreen, the empty stage shows there with its way out", async ({
  page,
}, info) => {
  await openScene(page, "s=live");
  await goFullscreen(page);
  const exit = page.getByRole("button", { name: "Exit fullscreen" });
  await observe(page, info, { exit }, async () => {
    await everyoneStops(page);
    await page.getByRole("heading", { name: "Go live" }).waitFor();
  });
  expect.soft(await fullscreenIsStage(page)).toBe(true);
  await expect.soft(page.getByRole("heading", { name: "Go live" })).toBeVisible();
  await expect.soft(exit).toBeVisible();
  await exit.click();
  await fullscreenNow(page, false);
  expect.soft(await anythingFullscreen(page)).toBe(false);
});

test("F-fullscreen.8 fullscreen, the settings open inside it, over the picture", async ({ page }, info) => {
  await openScene(page, "s=empty");
  await goFullscreen(page);
  const dialog = page.getByRole("dialog", { name: "Settings" });
  await observe(page, info, { dialog }, async () => {
    await page.getByRole("button", { name: "Settings" }).click();
    await dialog.waitFor();
  });
  await expect.soft(dialog).toBeVisible();
  expect.soft(await dialog.evaluate((d) => document.fullscreenElement?.contains(d) ?? false)).toBe(true);
  expect.soft(inside(await boxOf(dialog), windowBox(page))).toBe(true);
});

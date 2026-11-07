import { expect, test, type Page } from "@playwright/test";
import { blinks, drift } from "../support/frames.ts";
import { observe } from "../support/observe.ts";
import { openScene, wakeStage } from "../support/open.ts";
import { boxOf, everyoneStops, inside, pointAt, shownControls, stageOf } from "./stage.ts";

/** What's fullscreen now: nothing, or the stage's frame (the player). */
const fullscreenIsStage = (page: Page) =>
  page.evaluate(() => {
    const el = document.fullscreenElement;
    const box = document.querySelector('section[aria-label="Shared screen"] > div');
    return el !== null && el.parentElement === box;
  });
const anythingFullscreen = (page: Page) => page.evaluate(() => document.fullscreenElement !== null);

async function goFullscreen(page: Page): Promise<void> {
  await wakeStage(page);
  await page.getByRole("button", { name: "Fullscreen" }).click();
  await page.waitForTimeout(800);
  await wakeStage(page);
}

test("F-fullscreen.1 pointing at the fullscreen button says Fullscreen, and nothing moves", async ({ page }, info) => {
  await openScene(page, "s=live");
  await wakeStage(page);
  const button = page.getByRole("button", { name: "Fullscreen" });
  const tip = page.locator('[role="tooltip"][data-shown]');
  const seen = await observe(page, info, { button, tip }, async () => {
    await pointAt(page, button);
    await page.waitForTimeout(400);
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
  const stage = stageOf(page);
  const enter = page.getByRole("button", { name: "Fullscreen" });
  await observe(page, info, { view: stage.view, enter }, async () => {
    await enter.click();
    await page.waitForTimeout(800);
  });
  await wakeStage(page);
  expect.soft(await fullscreenIsStage(page)).toBe(true);
  await expect.soft(page.getByRole("button", { name: "Exit fullscreen" })).toBeVisible();
  const view = await boxOf(stage.view);
  const screen = page.viewportSize()!;
  // A wide picture fills the screen's width.
  expect.soft(Math.abs(view.width - screen.width)).toBeLessThan(1);
  await expect.soft(stage.box.getByLabel("Marina's shared screen")).toBeVisible();
  const outside = (await shownControls(page)).filter((c) => !inside(view, c.box)).map((c) => c.name);
  expect.soft(outside).toEqual([]);
});

test("F-fullscreen.3 fullscreen, a tall picture fills the screen's height with its controls on it", async ({
  page,
}, info) => {
  await openScene(page, "s=portrait");
  const stage = stageOf(page);
  await observe(page, info, { view: stage.view }, () => goFullscreen(page));
  await wakeStage(page);
  const view = await boxOf(stage.view);
  const screen = page.viewportSize()!;
  expect.soft(Math.abs(view.height - screen.height)).toBeLessThan(1);
  // Its own shape (9:16), as wide as the screen's height allows: on a monitor on its side, the
  // whole width.
  expect.soft(Math.abs(view.width - Math.min(screen.width, (screen.height * 9) / 16))).toBeLessThan(1);
  const controls = await shownControls(page);
  expect.soft(controls.length).toBeGreaterThan(1);
  expect.soft(controls.filter((c) => !inside(view, c.box)).map((c) => c.name)).toEqual([]);
});

test("F-fullscreen.4 Exit fullscreen brings the stage back to its place on the page", async ({ page }, info) => {
  await openScene(page, "s=live");
  const stage = stageOf(page);
  const before = await boxOf(stage.box);
  await goFullscreen(page);
  const exit = page.getByRole("button", { name: "Exit fullscreen" });
  await observe(page, info, { box: stage.box, exit }, async () => {
    await exit.click();
    await page.waitForTimeout(800);
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
    await page.waitForTimeout(600);
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
    await page.waitForTimeout(800);
  });
  expect.soft(await fullscreenIsStage(page)).toBe(true);
  // The focus stays on the button, now Exit fullscreen.
  await expect.soft(page.getByRole("button", { name: "Exit fullscreen" })).toBeFocused();
});

test("F-fullscreen.7 when everyone stops in fullscreen, the empty stage shows there with its way out", async ({
  page,
}, info) => {
  await openScene(page, "s=live");
  await goFullscreen(page);
  const exit = page.getByRole("button", { name: "Exit fullscreen" });
  await observe(page, info, { exit }, async () => {
    await everyoneStops(page);
    await page.waitForTimeout(900);
  });
  expect.soft(await fullscreenIsStage(page)).toBe(true);
  await expect.soft(page.getByRole("heading", { name: "Go live" })).toBeVisible();
  await expect.soft(exit).toBeVisible();
  await exit.click();
  await page.waitForTimeout(600);
  expect.soft(await anythingFullscreen(page)).toBe(false);
});

test("F-fullscreen.8 fullscreen, the settings open inside it, over the picture", async ({ page }, info) => {
  await openScene(page, "s=empty");
  await goFullscreen(page);
  const dialog = page.getByRole("dialog", { name: "Settings" });
  await observe(page, info, { dialog }, async () => {
    await page.getByRole("button", { name: "Settings" }).click();
    await page.waitForTimeout(600);
  });
  await expect.soft(dialog).toBeVisible();
  expect.soft(await dialog.evaluate((d) => document.fullscreenElement?.contains(d) ?? false)).toBe(true);
  expect.soft(inside({ x: 0, y: 0, ...page.viewportSize()! }, await boxOf(dialog))).toBe(true);
});

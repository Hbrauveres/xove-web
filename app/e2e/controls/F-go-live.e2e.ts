import { expect, test } from "@playwright/test";
import { blinks, drift } from "../support/frames.ts";
import { observe } from "../support/observe.ts";
import { openScene, wakeStage } from "../support/open.ts";
import { boxOf, control, inside, middleY, pictureOf, pointAt } from "./controls.ts";

const open = async (page: import("@playwright/test").Page) => {
  await openScene(page, "s=live");
  await wakeStage(page);
};

test("F-go-live.1 Go live waits at the right, a pill with its words, opening nothing when pointed at", async ({
  page,
}, info) => {
  await open(page);
  const goLive = control(page, "Go live");
  const full = control(page, "Fullscreen");
  const seen = await observe(page, info, { goLive }, async () => {
    await pointAt(page, goLive);
    await page.waitForTimeout(500);
  });
  await expect.soft(goLive).toHaveText("Go live");
  await expect.soft(goLive).toHaveAttribute("aria-expanded", "false");
  await expect.soft(goLive).toHaveAttribute("aria-haspopup", "menu");
  await expect.soft(page.getByRole("menu")).toHaveCount(0);
  // Just left of fullscreen, on its centre line, inside the picture.
  const g = await boxOf(goLive);
  const f = await boxOf(full);
  expect.soft(g.x + g.width).toBeLessThanOrEqual(f.x);
  expect.soft(Math.abs((await middleY(goLive)) - (await middleY(full)))).toBeLessThan(1);
  expect.soft(await inside(goLive, pictureOf(page))).toBe(true);
  expect.soft(blinks(seen.frames, "goLive")).toEqual([]);
  expect.soft(drift(seen.frames, "goLive")).toBeLessThan(1);
});

test("F-go-live.2 a click opens its menu above it: my screen, my camera and the settings", async ({ page }, info) => {
  await open(page);
  const goLive = control(page, "Go live");
  const menu = page.getByRole("menu");
  const seen = await observe(page, info, { goLive, menu }, async () => {
    await goLive.click();
  });
  await expect.soft(menu).toBeVisible();
  await expect.soft(goLive).toHaveAttribute("aria-expanded", "true");
  await expect.soft(menu.getByRole("menuitem")).toHaveText(["Share your screen", "Turn on your camera", "Settings"]);
  const m = await boxOf(menu);
  const g = await boxOf(goLive);
  // Above the pill, ending at its right, whole on the screen.
  expect.soft(m.y + m.height).toBeLessThanOrEqual(g.y);
  expect.soft(Math.abs(m.x + m.width - (g.x + g.width))).toBeLessThan(1);
  await expect.soft(menu).toBeInViewport({ ratio: 1 });
  expect.soft(blinks(seen.frames, "goLive")).toEqual([]);
  expect.soft(drift(seen.frames, "goLive")).toBeLessThan(1);
});

test("F-go-live.3 Share your screen from the menu starts my screen and takes me to it", async ({ page }, info) => {
  await open(page);
  await control(page, "Go live").click();
  const item = page.getByRole("menuitem", { name: "Share your screen" });
  const mine = control(page, "Stop sharing your screen");
  await observe(page, info, { item, mine }, async () => {
    await item.click();
    await page.waitForTimeout(2500);
    await wakeStage(page);
  });
  await expect.soft(page.getByRole("menu")).toHaveCount(0);
  await expect.soft(mine).toBeVisible();
  await expect.soft(mine).toHaveAttribute("aria-pressed", "true");
  await expect.soft(control(page, "Go live")).toHaveCount(0);
});

test("F-go-live.4 Turn on your camera from the menu starts my camera", async ({ page }, info) => {
  await open(page);
  await control(page, "Go live").click();
  const item = page.getByRole("menuitem", { name: "Turn on your camera" });
  const mine = control(page, "Turn off your camera");
  await observe(page, info, { item, mine }, async () => {
    await item.click();
    await page.waitForTimeout(2500);
    await wakeStage(page);
  });
  await expect.soft(page.getByRole("menu")).toHaveCount(0);
  await expect.soft(mine).toBeVisible();
  await expect.soft(mine).toHaveAttribute("aria-pressed", "true");
});

test("F-go-live.5 Settings from the menu opens the settings over Go live", async ({ page }, info) => {
  await open(page);
  const goLive = control(page, "Go live");
  await goLive.click();
  const item = page.getByRole("menuitem", { name: "Settings" });
  const dialog = page.getByRole("dialog", { name: "Settings" });
  await observe(page, info, { item, dialog }, async () => {
    await item.click();
    await page.waitForTimeout(400);
  });
  await expect.soft(dialog).toBeVisible();
  await expect.soft(page.getByRole("menu")).toHaveCount(0);
  const d = await boxOf(dialog);
  const g = await boxOf(goLive);
  // Above Go live, over it: its middle within the panel's width; whole on the screen.
  expect.soft(d.y + d.height).toBeLessThanOrEqual(g.y);
  expect.soft(d.x).toBeLessThanOrEqual(g.x + g.width / 2);
  expect.soft(d.x + d.width).toBeGreaterThanOrEqual(g.x + g.width / 2);
  await expect.soft(dialog).toBeInViewport({ ratio: 1 });
});

test("F-go-live.6 Escape closes the menu and gives the focus back to Go live", async ({ page }, info) => {
  await open(page);
  const goLive = control(page, "Go live");
  await goLive.click();
  const menu = page.getByRole("menu");
  await expect.soft(menu).toBeVisible();
  await observe(page, info, { goLive, menu }, async () => {
    await page.keyboard.press("Escape");
  });
  await expect.soft(menu).toHaveCount(0);
  await expect.soft(goLive).toHaveAttribute("aria-expanded", "false");
  await expect.soft(goLive).toBeFocused();
});

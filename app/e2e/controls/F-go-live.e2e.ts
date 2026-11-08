import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";
import { blinks, drift } from "../support/frames.ts";
import { glassUnderBreakingParents } from "../support/glass.ts";
import { observe } from "../support/observe.ts";
import { openScene, wakeStage } from "../support/open.ts";
import { boxOf, inside } from "../support/geometry.ts";
import { restOn, tabTo } from "../support/pointer.ts";
import { shownOpacity } from "../support/screen.ts";
import { chromeOf, control, pictureOf } from "../support/stage.ts";
import { HOVER_REST_MS, untilStill } from "../support/timing.ts";
import { middleY, openAndRestOnMenu } from "./controls.ts";

const open = async (page: Page) => {
  await openScene(page, "s=live");
  await wakeStage(page);
};

/** From Go live's menu, `item` clicked; returns my stream's button (`mine`) once my row stands in
 * place of the viewer bar. */
async function startFromMenu(page: Page, info: TestInfo, item: string, mine: string): Promise<Locator> {
  await open(page);
  await control(page, "Go live").click();
  const row = page.getByRole("menuitem", { name: item });
  const button = control(page, mine);
  await observe(page, info, { item: row, mine: button }, async () => {
    await row.click();
    await button.waitFor({ state: "attached" });
    await untilStill(page);
    await wakeStage(page);
  });
  return button;
}

test("F-go-live.1 Go live waits at the right, a pill with its words, opening nothing when pointed at", async ({
  page,
}, info) => {
  await open(page);
  const goLive = control(page, "Go live");
  const full = control(page, "Fullscreen");
  const seen = await observe(page, info, { goLive }, async () => {
    await restOn(page, goLive, HOVER_REST_MS);
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
  expect.soft(inside(await boxOf(goLive), await boxOf(pictureOf(page)))).toBe(true);
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
  const mine = await startFromMenu(page, info, "Share your screen", "Stop sharing your screen");
  await expect.soft(page.getByRole("menu")).toHaveCount(0);
  await expect.soft(mine).toBeVisible();
  await expect.soft(mine).toHaveAttribute("aria-pressed", "true");
  await expect.soft(control(page, "Go live")).toHaveCount(0);
});

test("F-go-live.4 Turn on your camera from the menu starts my camera", async ({ page }, info) => {
  const mine = await startFromMenu(page, info, "Turn on your camera", "Turn off your camera");
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
    await dialog.waitFor();
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

test("F-go-live.7 its open menu stays up, glass over the stream, while the pointer rests", async ({ page }) => {
  await open(page);
  const menu = page.getByRole("menu");
  // The pointer rests on the open menu past the controls' wait: nothing fades, its glass blurs throughout.
  const { opening, resting } = await openAndRestOnMenu(page, control(page, "Go live"), menu);
  await expect.soft(chromeOf(page)).toHaveAttribute("data-chrome", "shown");
  await expect.soft(menu).toBeVisible();
  expect.soft(await shownOpacity(control(page, "Go live"))).toBe(1);
  expect.soft(opening).toEqual([]);
  expect.soft(resting).toEqual([]);
  expect.soft(await glassUnderBreakingParents(page)).toEqual([]);
});

test("F-go-live.8 opened from the keyboard, Escape closes the menu and the focus is back on Go live", async ({
  page,
}, info) => {
  await open(page);
  const goLive = control(page, "Go live");
  const menu = page.getByRole("menu");
  await tabTo(page, goLive);
  await page.keyboard.press("Enter");
  await menu.waitFor();
  await observe(page, info, { goLive, menu }, async () => {
    await page.keyboard.press("Escape");
    await menu.waitFor({ state: "detached" });
  });
  await expect.soft(goLive).toBeFocused();
  expect.soft(await goLive.evaluate((b) => b.matches(":focus-visible"))).toBe(true);
});

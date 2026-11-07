// Where people meet the shared blocks in the app: the steps that open each place, shared by the
// blocks' tests.
import type { Locator, Page } from "@playwright/test";
import { openScene, wakeStage } from "../support/open.ts";

/** The colours the blocks are checked against (tokens.css). */
export const COLOR = {
  accent: "rgb(239, 75, 75)",
  accentLight: "rgb(243, 106, 106)",
  accentInk: "rgb(58, 8, 8)",
  text: "rgb(235, 235, 236)",
  muted: "rgb(154, 154, 159)",
  glass: "rgba(10, 10, 11, 0.72)",
  glassLit: "rgba(40, 40, 44, 0.85)",
};

/** Points at the middle of an element, as a mouse would, in a few steps. */
export async function pointAt(page: Page, target: Locator): Promise<void> {
  const b = await target.boundingBox();
  if (b) await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 4 });
}

/** The pointer somewhere neutral, out of the stage's buttons' way (the page's top-left corner). */
export const pointAway = (page: Page) => page.mouse.move(2, 2, { steps: 2 });

/** Someone else's stream on the stage (Marina's), its controls awake. */
export async function watching(page: Page, extra = ""): Promise<void> {
  await openScene(page, `s=live${extra}`);
  await wakeStage(page);
}

/** The empty room, where I start my screen ("Share your screen"); its controls awake. */
export async function sharingMyScreen(page: Page): Promise<void> {
  await openScene(page, "s=empty");
  await page.getByRole("button", { name: "Share your screen" }).click();
  await page.getByRole("button", { name: "Stop sharing your screen" }).waitFor();
  await page.waitForTimeout(600);
  await wakeStage(page);
}

/** The empty room with my camera on; its controls awake. */
export async function myCameraOn(page: Page): Promise<void> {
  await openScene(page, "s=empty");
  await page.getByRole("button", { name: "Turn on your camera" }).click();
  await page.getByRole("button", { name: "Turn off your camera" }).waitFor();
  await page.waitForTimeout(600);
  await wakeStage(page);
}

/** The settings, opened from the empty stage's cog, on a tab. */
export async function settingsOn(page: Page, tab: "Screen" | "Camera" | "Voice"): Promise<Locator> {
  await openScene(page, "s=empty");
  await page.getByRole("button", { name: "Settings" }).click();
  const panel = page.getByRole("dialog", { name: "Settings" });
  await panel.getByRole("tab", { name: tab }).click();
  await page.waitForTimeout(tab === "Camera" ? 1200 : 400);
  return panel;
}

/** My menu, opened from my account button in the header. */
export async function myMenu(page: Page, extra = ""): Promise<Locator> {
  await openScene(page, `s=live${extra}`);
  await page.getByRole("button", { name: /: account/ }).click();
  const menu = page.getByRole("dialog", { name: "Account" });
  await menu.waitFor();
  await page.waitForTimeout(400);
  return menu;
}

/** Presses Tab until `target` has the focus (at most `max` times). */
export async function tabTo(page: Page, target: Locator, max = 12): Promise<void> {
  for (let i = 0; i < max; i++) {
    if (await target.evaluate((e) => e === document.activeElement)) return;
    await page.keyboard.press("Tab");
  }
}

/** A computed style of an element's pseudo-element (`::before`, `::after`). */
export const pseudo = (l: Locator, which: string, prop: string) =>
  l.evaluate((e, [w, p]) => getComputedStyle(e, w).getPropertyValue(p!), [which, prop] as const);

// Where people meet the shared blocks in the app: the steps that open each place, shared by the
// blocks' tests.
import type { Locator, Page } from "@playwright/test";
import { openScene, wakeStage } from "../support/open.ts";
import { stageOf } from "../support/stage.ts";
import { untilStill } from "../support/timing.ts";
import { myMenu } from "../header/header.ts";

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
  await stageOf(page).locator(`video[aria-label="Your shared screen"]`).waitFor();
  await wakeStage(page);
}

/** The empty room with my camera on; its controls awake. */
export async function myCameraOn(page: Page): Promise<void> {
  await openScene(page, "s=empty");
  await page.getByRole("button", { name: "Turn on your camera" }).click();
  await page.getByRole("button", { name: "Turn off your camera" }).waitFor();
  await stageOf(page).locator(`video[aria-label="Your camera"]`).waitFor();
  await wakeStage(page);
}

/** The settings, opened from the empty stage's cog, on a tab, settled. */
export async function settingsOn(page: Page, tab: "Screen" | "Camera" | "Voice", query = "s=empty"): Promise<Locator> {
  await openScene(page, query);
  await page.getByRole("button", { name: "Settings" }).click();
  const panel = page.getByRole("dialog", { name: "Settings" });
  const its = panel.getByRole("tab", { name: tab });
  await its.click();
  await panel.getByRole("tabpanel", { name: tab }).waitFor();
  await untilStill(panel);
  return panel;
}

/** My menu, opened from my account button in the header, settled. */
export async function openMyMenu(page: Page, extra = ""): Promise<Locator> {
  await openScene(page, `s=live${extra}`);
  await page.getByRole("button", { name: /: account/ }).click();
  const menu = myMenu(page);
  await menu.waitFor();
  await untilStill(menu);
  return menu;
}

/** A computed style of an element's pseudo-element (`::before`, `::after`). */
export const pseudo = (l: Locator, which: string, prop: string) =>
  l.evaluate((e, [w, p]) => getComputedStyle(e, w).getPropertyValue(p), [which, prop] as const);

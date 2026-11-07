// Opens the harness on a scene, at the test's size, ready to be checked: the clock fixed (the
// durations on screen don't run), the pictures still, the room panel hidden, the fonts loaded.
import type { Page } from "@playwright/test";

/** The moment every test lives in, so times on screen ("1:12:43", "18 min") read the same each run. */
export const FIXED_TIME = new Date("2026-11-07T20:00:00-03:00");

/** How long the room takes to settle on the fakes: people join, streams start, the stage picks. */
const SETTLE_MS = 1800;

export interface SceneOptions {
  /** Pictures drawn once and held (default), or moving like real streams. */
  still?: boolean;
}

/**
 * The harness at `query` (its `?s=`, `&page=` options, without the `?`), settled. Pictures are still
 * unless asked otherwise.
 */
export async function openScene(page: Page, query: string, { still = true }: SceneOptions = {}): Promise<void> {
  await page.clock.setFixedTime(FIXED_TIME);
  const extra = still ? "&panel=0&still=1" : "&panel=0";
  await page.goto(`/?${query}${extra}`);
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await page.waitForTimeout(SETTLE_MS);
}

/** Wakes the stage's controls with a small move over it, as a person moving the mouse would. */
export async function wakeStage(page: Page): Promise<void> {
  const stage = await page.getByRole("region", { name: "Shared screen" }).boundingBox();
  if (!stage) return;
  const x = stage.x + stage.width / 2;
  const y = stage.y + stage.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.move(x + 5, y + 3);
  await page.waitForTimeout(400);
}

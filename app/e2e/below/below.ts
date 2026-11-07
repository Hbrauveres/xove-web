// What the cases under the stage share, beyond support/: the small view, and putting someone on the
// stage from their preview.
import { expect, type Locator, type Page } from "@playwright/test";
import { stageOf } from "../support/stage.ts";
import { untilStill } from "../support/timing.ts";

/** The small view, by what a screen reader hears. */
export const smallViewOf = (page: Page): Locator =>
  page.getByRole("application", { name: /drag or use the arrow keys/ });

/** Puts `person`'s stream on the stage from their preview ("Rafa · screen"), and waits until it plays. */
export async function watch(page: Page, preview: string): Promise<void> {
  await page.getByRole("button", { name: `Watch ${preview}` }).click();
  await stageUpFor(page, preview.split(" · ")[0] ?? preview);
}

/** Waits until `name`'s stream is on the stage: their name heads it, and the stage is still. */
export async function stageUpFor(page: Page, name: string): Promise<void> {
  await expect(page.getByRole("heading", { name, level: 2 })).toBeVisible();
  await untilStill(stageOf(page));
}

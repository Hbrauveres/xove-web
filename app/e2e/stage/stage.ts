// What the stage's cases share: the stage's parts (its box, the picture's place inside it, the
// controls' layer and the frame that fades them), a picture of another shape, the buttons shown on
// the picture, and the pointer resting on the stage. The rest is in support/.
import type { Page } from "@playwright/test";
import { boxOf, centreX, type Box } from "../support/geometry.ts";
import { setShape } from "../support/harness.ts";
import { wakeStage } from "../support/open.ts";
import { pictureOf, stageOf } from "../support/stage.ts";
import { CHROME_IDLE_MS, spend, untilStill } from "../support/timing.ts";

/** Pictures' shapes (width ÷ height): the harness's wide screen and its tall camera. */
export const WIDE = 16 / 9;
export const TALL = 9 / 16;

/** The stage's parts: its box, the picture's place inside it (the view), and the controls' layer on it. */
export function stageParts(page: Page) {
  const region = stageOf(page);
  const box = page.locator('section[aria-label="Shared screen"] > div').first();
  const layer = pictureOf(page);
  const view = layer.locator("xpath=preceding-sibling::div[1]");
  // The frame that takes the moves and says whether the controls are shown.
  const frame = box.locator("> div").first();
  return { region, box, layer, view, frame };
}

/** The picture in this shape (width ÷ height), its glide over, then the controls woken. */
export async function reshape(page: Page, shape: number): Promise<void> {
  await setShape(page, shape);
  await untilStill(stageOf(page));
  await wakeStage(page);
}

/** Every button shown on the controls' layer, by name, with its box. */
export function shownControls(page: Page): Promise<{ name: string; box: Box }[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll("[data-on-picture] button")]
      .filter((b) => {
        let opacity = 1;
        for (let e: Element | null = b; e; e = e.parentElement) opacity *= Number(getComputedStyle(e).opacity);
        return b.checkVisibility({ visibilityProperty: true }) && opacity > 0.5 && !b.closest("[inert]");
      })
      .map((b) => {
        const r = b.getBoundingClientRect();
        return {
          name: b.getAttribute("aria-label") ?? (b.textContent ?? "").trim(),
          box: { x: r.x, y: r.y, width: r.width, height: r.height },
        };
      }),
  );
}

/**
 * Rests the mouse somewhere on the stage, away from its controls, for the time the controls take to
 * fade (CHROME_IDLE_MS), and until their fade is over.
 */
export async function restOnStage(page: Page): Promise<void> {
  const b = await boxOf(stageParts(page).box);
  await page.mouse.move(centreX(b), b.y + b.height * 0.3, { steps: 2 });
  await spend(page, CHROME_IDLE_MS);
  await untilStill(stageOf(page), { property: "opacity" });
}

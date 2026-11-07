// What the cases under the stage share: the picture's box, its shape made narrower as a narrow stream
// would make it, pointing at an element as a person would, and boxes compared.
import type { Locator, Page } from "@playwright/test";

export type Box = { x: number; y: number; width: number; height: number };

/** The picture over the stage: the layer its controls sit on, the picture's size and place. */
export const pictureOf = (page: Page) => page.locator("[data-on-picture]");

/** The small view, by what a screen reader hears. */
export const smallViewOf = (page: Page) => page.getByRole("application", { name: /drag or use the arrow keys/ });

/** An element's box, which the case needs there. */
export async function boxOf(locator: Locator): Promise<Box> {
  const b = await locator.boundingBox();
  if (!b) throw new Error(`${locator.toString()} has no box`);
  return b;
}

/** Whether `inner` lies whole inside `outer` (half a pixel of rounding allowed). */
export const inside = (outer: Box, inner: Box) =>
  inner.x >= outer.x - 0.5 &&
  inner.y >= outer.y - 0.5 &&
  inner.x + inner.width <= outer.x + outer.width + 0.5 &&
  inner.y + inner.height <= outer.y + outer.height + 0.5;

/** Whether two boxes share any area. */
export const overlap = (a: Box, b: Box) =>
  a.x < b.x + b.width - 0.5 && b.x < a.x + a.width - 0.5 && a.y < b.y + b.height - 0.5 && b.y < a.y + a.height - 0.5;

/** Moves the mouse onto the middle of `locator`, in a few steps, as a hand would. */
export async function pointAt(page: Page, locator: Locator): Promise<void> {
  // On a short window the info row is under the fold: scrolled to first, as a person would.
  await locator.scrollIntoViewIfNeeded();
  const b = await boxOf(locator);
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 4 });
}

/** The picture made `width` px wide, as a stream that narrow would make it; then the controls woken. */
export { shapePicture as narrowPicture } from "../controls/controls.ts";

/** What reaches the screen of an element: its opacity times its ancestors'. */
export const shownOpacity = (locator: Locator) =>
  locator.evaluate((el) => {
    let o = 1;
    for (let e: Element | null = el; e; e = e.parentElement) o *= Number(getComputedStyle(e).opacity);
    return o;
  });

/** The element that has the keyboard's focus, by its spoken name ("" for the page itself). */
export const focusedName = (page: Page) =>
  page.evaluate(() =>
    document.activeElement === document.body ? "" : (document.activeElement?.getAttribute("aria-label") ?? "?"),
  );

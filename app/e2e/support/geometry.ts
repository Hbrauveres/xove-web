// Where things are on the screen: an element's box, and boxes compared (inside, overlapping, their
// centres). Plain functions over boxes, tested on their own (geometry.test.ts); `boxOf` reads one.
import type { Locator, Page } from "@playwright/test";

/** A box on the screen, in CSS px. */
export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** How much rounding a comparison of boxes allows, in CSS px. */
const ROUNDING = 0.5;

/**
 * The box of the first element `target` finds. An element that isn't there, or isn't laid out,
 * fails the case: a case never measures nothing.
 */
export async function boxOf(target: Locator): Promise<Box> {
  const box = await target.first().boundingBox();
  if (!box) throw new Error(`${target.toString()} has no box: it isn't on the screen`);
  return box;
}

/** Whether `inner` lies whole inside `outer` (half a pixel of rounding allowed). */
export const inside = (inner: Box, outer: Box): boolean =>
  inner.x >= outer.x - ROUNDING &&
  inner.y >= outer.y - ROUNDING &&
  inner.x + inner.width <= outer.x + outer.width + ROUNDING &&
  inner.y + inner.height <= outer.y + outer.height + ROUNDING;

/** Whether two boxes share any area (touching edges don't). */
export const overlap = (a: Box, b: Box): boolean =>
  a.x < b.x + b.width - ROUNDING &&
  b.x < a.x + a.width - ROUNDING &&
  a.y < b.y + b.height - ROUNDING &&
  b.y < a.y + a.height - ROUNDING;

/** A box's horizontal and vertical centre. */
export const centreX = (b: Box): number => b.x + b.width / 2;
export const centreY = (b: Box): number => b.y + b.height / 2;

/** The window, as a box. */
export function windowBox(page: Page): Box {
  const size = page.viewportSize();
  if (!size) throw new Error("The page has no window size");
  return { x: 0, y: 0, ...size };
}

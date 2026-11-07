// The mouse and the keyboard, as a person uses them: pointing at an element (scrolled to first, as a
// person would on a short window), clicking it, resting on it, moving off to nothing, tabbing to it.
import type { Locator, Page } from "@playwright/test";
import { boxOf, centreX, centreY } from "./geometry.ts";
import { spend } from "./timing.ts";

/** How many steps a hand's move takes: enough for the page to see the pointer travel. */
const STEPS = 4;

export interface PointOptions {
  /** How many steps the move takes. */
  steps?: number;
}

/** Moves the mouse onto the middle of `target`, in a few steps; fails when it isn't on the screen. */
export async function pointAt(page: Page, target: Locator, { steps = STEPS }: PointOptions = {}): Promise<void> {
  await target.first().scrollIntoViewIfNeeded();
  const b = await boxOf(target);
  await page.mouse.move(centreX(b), centreY(b), { steps });
}

/** Clicks the middle of `target` with the mouse, even a greyed (aria-disabled) control. */
export async function clickAt(page: Page, target: Locator): Promise<void> {
  await pointAt(page, target);
  await page.mouse.down();
  await page.mouse.up();
}

/**
 * The pointer resting on `target` for `ms`: the behaviour's own rest (a tooltip's, a drop-up's), by
 * its constant from timing.ts.
 */
export async function restOn(page: Page, target: Locator, ms: number): Promise<void> {
  await pointAt(page, target);
  await spend(page, ms);
}

/** The pointer moved off to the window's left edge, half way down: on nothing that reacts. */
export async function pointAway(page: Page): Promise<void> {
  const size = page.viewportSize();
  if (!size) throw new Error("The page has no window size");
  await page.mouse.move(2, Math.round(size.height / 2), { steps: 2 });
}

/**
 * The pointer over the picture's upper part, waking its controls without touching one (a fixed
 * point lands on a button at one size and above the picture on a monitor on its side).
 */
export async function overPicture(page: Page): Promise<void> {
  const stage = await boxOf(page.getByRole("region", { name: "Shared screen" }));
  const fullscreen = page.getByRole("button", { name: "Fullscreen" });
  // Level with the picture's middle, a third of the way down from the stage's top; the picture
  // ends above Fullscreen, so the third is kept above that.
  const bottom = (await fullscreen.count()) ? (await boxOf(fullscreen)).y : stage.y + stage.height;
  await page.mouse.move(centreX(stage), stage.y + (bottom - stage.y) / 3);
}

/** Whether `target` has the keyboard's focus. */
export const focused = (target: Locator): Promise<boolean> =>
  target.first().evaluate((el) => el === document.activeElement);

/** Presses Tab until `target` has the focus; fails after `max` presses. */
export async function tabTo(page: Page, target: Locator, max = 40): Promise<void> {
  for (let i = 0; i < max; i++) {
    if (await focused(target)) return;
    await page.keyboard.press("Tab");
  }
  if (!(await focused(target))) throw new Error(`${target.toString()} never took the focus in ${max} tabs`);
}

/** The spoken name of what has the keyboard's focus ("" for the page itself). */
export const focusedName = (page: Page): Promise<string> =>
  page.evaluate(() =>
    document.activeElement === document.body || !document.activeElement
      ? ""
      : (document.activeElement.getAttribute("aria-label") ?? document.activeElement.textContent?.trim() ?? ""),
  );

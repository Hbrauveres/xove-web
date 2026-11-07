// What the header's cases share: the bar and its three buttons, their panels, pointing at something,
// and the room's streams stopping and starting (the harness's helpers), so the activity has news.
import type { Locator, Page } from "@playwright/test";
import { wakeStage } from "../support/open.ts";

/** The header and its parts, found as a screen reader hears them. */
export function headerOf(page: Page) {
  const bar = page.getByRole("banner");
  return {
    bar,
    wordmark: bar.getByRole("img", { name: "Xovê" }),
    pill: bar.getByRole("button", { name: /^Activity/ }),
    people: bar.getByRole("button", { name: /people? here$/ }),
    me: bar.getByRole("button", { name: /: account, / }),
  };
}

/** The three panels, by their names. */
export const activityList = (page: Page) => page.getByRole("dialog", { name: "Activity" });
export const peoplePanel = (page: Page) => page.getByRole("dialog", { name: "Here now" });
export const myMenu = (page: Page) => page.getByRole("dialog", { name: "Account" });

/** How long a panel takes to unroll (260 ms) or roll back, with room to spare. */
export const ROLL_WAIT = 450;

/** The pointer resting on an element's middle, as a person moving to it. */
export async function pointAt(page: Page, target: Locator, ms = 300): Promise<void> {
  const b = await target.first().boundingBox();
  if (!b) throw new Error("Nothing to point at: the element isn't on the screen");
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 4 });
  await page.waitForTimeout(ms);
}

/** The pointer moved off to the screen's left edge, half way down: on nothing that reacts. */
export async function pointAway(page: Page): Promise<void> {
  const size = page.viewportSize();
  await page.mouse.move(2, Math.round((size?.height ?? 480) / 2));
  await page.waitForTimeout(250);
}

/** A panel opened from its button, settled. */
export async function openFrom(page: Page, button: Locator, panel: Locator): Promise<void> {
  await button.click();
  await panel.waitFor();
  await page.waitForTimeout(ROLL_WAIT);
}

/** Every stream stops (the harness's `everyoneStops`), and the room has noticed. */
export async function everyoneStops(page: Page): Promise<void> {
  await page.evaluate(() => (window as unknown as { __xove: { everyoneStops: () => void } }).__xove.everyoneStops());
  await headerOf(page)
    .pill.and(page.getByRole("button", { name: /turned off their camera/ }))
    .waitFor();
  await page.waitForTimeout(300);
}

/** Marina starts sharing her screen (the harness's `marinaGoesLive`), and the room has noticed. */
export async function marinaGoesLive(page: Page): Promise<void> {
  await page.evaluate(() => (window as unknown as { __xove: { marinaGoesLive: () => void } }).__xove.marinaGoesLive());
  await page.getByRole("button", { name: /^Activity: Marina started sharing/ }).waitFor();
  await page.waitForTimeout(300);
}

/** I share my screen from the stage's Go live menu, and the stage shows it. */
export async function iShareMyScreen(page: Page): Promise<void> {
  await wakeStage(page);
  await page.getByRole("button", { name: "Go live" }).click();
  await page.getByRole("menuitem", { name: "Share your screen" }).click();
  await page.getByRole("button", { name: "Stop sharing your screen" }).waitFor();
  await page.getByRole("button", { name: /^Activity: You started sharing/ }).waitFor();
  await page.waitForTimeout(400);
}

/** The middle of an element, in CSS px. */
export async function middleOf(target: Locator): Promise<{ x: number; y: number }> {
  const b = await target.first().boundingBox();
  if (!b) throw new Error("No box: the element isn't on the screen");
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
}

/** Whether what's drawn at the element's middle is the element itself (nothing covers it). */
export async function onTop(target: Locator): Promise<boolean> {
  return target.first().evaluate((el) => {
    const r = el.getBoundingClientRect();
    const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return hit !== null && (el === hit || el.contains(hit));
  });
}

/** The element's box fully inside the window. */
export async function inside(page: Page, target: Locator): Promise<boolean> {
  const b = await target.first().boundingBox();
  const v = page.viewportSize();
  if (!b || !v) return false;
  return b.x >= 0 && b.y >= 0 && b.x + b.width <= v.width + 0.5 && b.y + b.height <= v.height + 0.5;
}

/** A computed style of the element. */
export const styleOf = (target: Locator, prop: string) =>
  target.first().evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), prop);

/** The accessible name of what has the keyboard's focus. */
export const focusedName = (page: Page) =>
  page.evaluate(() => document.activeElement?.getAttribute("aria-label") ?? document.activeElement?.tagName ?? "");

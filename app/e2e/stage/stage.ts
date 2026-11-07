// What the stage's cases share: the stage, its picture and its controls' layer, a picture of another
// shape, and where things sit on it. The harness's pictures are 16:9 and 9:16; other shapes are made by
// setting the shape on the stage's box, as a stream of that shape would.
import type { Locator, Page } from "@playwright/test";
import { wakeStage } from "../support/open.ts";

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** The stage: its box, the picture's place inside it (the view), and the controls' layer on it. */
export function stageOf(page: Page) {
  const region = page.getByRole("region", { name: "Shared screen" });
  const box = page.locator('section[aria-label="Shared screen"] > div').first();
  const layer = page.locator("[data-on-picture]");
  const view = layer.locator("xpath=preceding-sibling::div[1]");
  // The frame that takes the moves and says whether the controls are shown.
  const frame = box.locator("> div").first();
  return { region, box, layer, view, frame };
}

/** The picture in this shape (width ÷ height), then the controls woken. */
export async function setShape(page: Page, shape: number): Promise<void> {
  await page.evaluate((s) => {
    const box = document.querySelector<HTMLElement>('section[aria-label="Shared screen"] > div');
    box?.style.setProperty("--shape", String(s));
  }, shape);
  await page.waitForTimeout(700);
  await wakeStage(page);
}

/** A locator's box, or a zero box where it isn't. */
export async function boxOf(locator: Locator): Promise<Box> {
  return (await locator.first().boundingBox()) ?? { x: 0, y: 0, width: 0, height: 0 };
}

/** Whether `inner` lies inside `outer` (half a pixel's rounding allowed). */
export function inside(outer: Box, inner: Box): boolean {
  return (
    inner.x >= outer.x - 0.5 &&
    inner.y >= outer.y - 0.5 &&
    inner.x + inner.width <= outer.x + outer.width + 0.5 &&
    inner.y + inner.height <= outer.y + outer.height + 0.5
  );
}

export const centreY = (b: Box) => b.y + b.height / 2;
export const centreX = (b: Box) => b.x + b.width / 2;

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

/** Moves the mouse to the middle of a box, in a few steps, as a hand would. */
export async function pointAt(page: Page, locator: Locator): Promise<void> {
  const b = await boxOf(locator);
  await page.mouse.move(centreX(b), centreY(b), { steps: 4 });
}

/** Rests the mouse somewhere on the stage, away from its controls, and waits past the controls' fade. */
export async function restOnStage(page: Page, ms = 3200): Promise<void> {
  const b = await boxOf(stageOf(page).box);
  await page.mouse.move(b.x + b.width / 2, b.y + b.height * 0.3, { steps: 2 });
  await page.waitForTimeout(ms);
}

/** Everyone live stops sharing (the harness's own hook). */
export const everyoneStops = (page: Page) =>
  page.evaluate(() => (window as unknown as { __xove: { everyoneStops: () => void } }).__xove.everyoneStops());

/** Marina starts sharing her screen (the harness's own hook). */
export const marinaGoesLive = (page: Page) =>
  page.evaluate(() => (window as unknown as { __xove: { marinaGoesLive: () => void } }).__xove.marinaGoesLive());

/** How opaque an element reaches the screen: its opacity times its ancestors'. */
export function seenOpacity(locator: Locator): Promise<number> {
  return locator.first().evaluate((el) => {
    let opacity = 1;
    for (let e: Element | null = el; e; e = e.parentElement) opacity *= Number(getComputedStyle(e).opacity);
    return opacity;
  });
}

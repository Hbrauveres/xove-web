// What the settings' cases share: my own stream with the settings open over it, the panel and its
// parts, resting the pointer on something, a record of controls greyed even for a moment, and how the
// glass measures over a busy picture.
import type { Locator, Page } from "@playwright/test";
import { openScene, wakeStage } from "../support/open.ts";

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** The settings panel. */
export const panelOf = (page: Page) => page.getByRole("dialog", { name: "Settings" });

/** A tab of the panel, by its words. */
export const tabOf = (page: Page, name: "Screen" | "Camera" | "Voice") =>
  panelOf(page).getByRole("tab", { name, exact: true });

/** My own round buttons on my stream. */
export function myButtons(page: Page) {
  return {
    screen: page.getByRole("button", { name: /^(Share your screen|Stop sharing your screen)$/ }),
    camera: page.getByRole("button", { name: /^(Turn on your camera|Turn off your camera)$/ }),
    voice: page.getByRole("button", { name: /^(Share your voice|Stop sharing your voice|Turn off your voice)$/ }),
    cog: page.getByRole("button", { name: "Settings", exact: true }),
  };
}

/** My own stream on the stage: the harness's room with nobody live, then my screen shared. */
export async function myStream(page: Page, query = "s=empty", { camera = false } = {}): Promise<void> {
  await openScene(page, query);
  await page.getByRole("button", { name: "Share your screen" }).first().click();
  await page.getByRole("button", { name: "Stop sharing your screen" }).waitFor();
  if (camera) {
    await page.getByRole("button", { name: "Turn on your camera" }).first().click();
    await page.getByRole("button", { name: "Turn off your camera" }).waitFor();
  }
  await page.waitForTimeout(500);
  await wakeStage(page);
}

/** The settings opened from my stream's cog, settled (in, 260 ms). */
export async function openSettings(page: Page): Promise<void> {
  await wakeStage(page);
  await myButtons(page).cog.click();
  await panelOf(page).waitFor();
  await page.waitForTimeout(400);
}

/** The pointer resting on an element's middle, as a person moving to it, for `ms` after. */
export async function restOn(page: Page, target: Locator, ms = 450): Promise<void> {
  const b = await target.first().boundingBox();
  if (!b) throw new Error("Nothing to rest on: the element isn't on the screen");
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 6 });
  await page.waitForTimeout(ms);
}

/** The pointer moved off to a calm spot of the stage, above the buttons and away from the panel. */
export async function moveAway(page: Page, ms = 450): Promise<void> {
  const stage = await page.getByRole("region", { name: "Shared screen" }).boundingBox();
  if (!stage) return;
  await page.mouse.move(stage.x + stage.width * 0.15, stage.y + stage.height * 0.3, { steps: 4 });
  await page.waitForTimeout(ms);
}

/** A locator's box, or a zero box where it isn't. */
export async function boxOf(locator: Locator): Promise<Box> {
  return (await locator.first().boundingBox()) ?? { x: 0, y: 0, width: 0, height: 0 };
}

/** Clicks an option of a segmented control (its words), as a person does. */
export const optionOf = (page: Page, group: string, option: string) =>
  page.getByRole("radiogroup", { name: group }).getByText(option, { exact: true });

/**
 * Starts recording every moment one of the page's buttons or fields turns greyed (disabled), even
 * for a single frame; the returned function stops and gives back the names of what did.
 */
export async function startGreyWatch(page: Page): Promise<() => Promise<string[]>> {
  await page.evaluate(() => {
    const seen: string[] = [];
    const name = (el: Element) =>
      el.getAttribute("aria-label") ||
      el.closest("label")?.textContent?.trim() ||
      el.textContent?.trim().slice(0, 40) ||
      el.tagName.toLowerCase();
    const observer = new MutationObserver((records) => {
      for (const r of records) {
        const el = r.target as Element;
        const on =
          r.attributeName === "disabled" ? el.hasAttribute("disabled") : el.getAttribute("aria-disabled") === "true";
        if (on) seen.push(name(el));
      }
    });
    observer.observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ["disabled", "aria-disabled"],
    });
    (window as unknown as { __grey: { seen: string[]; observer: MutationObserver } }).__grey = { seen, observer };
  });
  return () =>
    page.evaluate(() => {
      const grey = (window as unknown as { __grey: { seen: string[]; observer: MutationObserver } }).__grey;
      grey.observer.disconnect();
      return [...new Set(grey.seen)];
    });
}

/** What a patch of the screen holds: its mean brightness (0–255), its spread (5th to 95th percentile), its sharpest step between neighbours. */
export interface Patch {
  mean: number;
  spread: number;
  step: number;
}

/** Measures a patch of the screen, as a person sees it. */
export async function measure(page: Page, clip: Box): Promise<Patch> {
  const png = await page.screenshot({ clip, scale: "css" });
  return page.evaluate(async (data) => {
    const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
    const bitmap = await createImageBitmap(new Blob([bytes], { type: "image/png" }));
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(bitmap, 0, 0);
    const { data: px, width, height } = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
    const lum = new Float32Array(width * height);
    for (let i = 0; i < width * height; i++)
      lum[i] = 0.2126 * px[i * 4]! + 0.7152 * px[i * 4 + 1]! + 0.0722 * px[i * 4 + 2]!;
    const sorted = [...lum].sort((a, b) => a - b);
    const at = (q: number) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))]!;
    let step = 0;
    for (let y = 0; y < height; y++)
      for (let x = 1; x < width; x++) step = Math.max(step, Math.abs(lum[y * width + x]! - lum[y * width + x - 1]!));
    for (let y = 1; y < height; y++)
      for (let x = 0; x < width; x++) step = Math.max(step, Math.abs(lum[y * width + x]! - lum[(y - 1) * width + x]!));
    const mean = lum.reduce((a, b) => a + b, 0) / lum.length;
    return { mean, spread: at(0.95) - at(0.05), step };
  }, png.toString("base64"));
}

/** Hides parts of the page while measuring, by a CSS rule; the returned function puts them back. */
export async function hide(page: Page, selector: string): Promise<() => Promise<void>> {
  const tag = await page.addStyleTag({ content: `${selector} { visibility: hidden !important; }` });
  await page.waitForTimeout(100);
  return async () => {
    await tag.evaluate((el) => (el as Element).remove());
    await page.waitForTimeout(100);
  };
}

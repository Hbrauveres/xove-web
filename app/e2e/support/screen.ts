// What reaches the screen: how opaque an element is drawn (its own opacity times its ancestors'),
// whether it's on top at its middle, and what a patch of the screen holds, measured from a
// screenshot as a person sees it (for what has no role or name: the stage's light, its static).
import type { Locator, Page } from "@playwright/test";
import type { Box } from "./geometry.ts";

/** How opaque an element reaches the screen, 0 to 1: its opacity times its ancestors'. */
export const shownOpacity = (target: Locator): Promise<number> =>
  target.first().evaluate((el) => {
    let o = 1;
    for (let e: Element | null = el; e; e = e.parentElement) o *= Number(getComputedStyle(e).opacity);
    return o;
  });

/** Whether what's drawn at the element's middle is the element itself (nothing covers it). */
export const onTop = (target: Locator): Promise<boolean> =>
  target.first().evaluate((el) => {
    const r = el.getBoundingClientRect();
    const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return hit !== null && (el === hit || el.contains(hit));
  });

/**
 * What a patch of the screen holds: its mean brightness (0–255), its spread (5th to 95th
 * percentile) and its sharpest step between neighbouring pixels.
 */
export interface Patch {
  mean: number;
  spread: number;
  step: number;
}

/** Measures a patch of the screen from a screenshot, in CSS pixels. */
export async function patchOf(page: Page, clip: Box): Promise<Patch> {
  const png = await page.screenshot({ clip, scale: "css" });
  return page.evaluate(async (data) => {
    const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
    const bitmap = await createImageBitmap(new Blob([bytes], { type: "image/png" }));
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No canvas to measure the screenshot on");
    ctx.drawImage(bitmap, 0, 0);
    const { data: px, width, height } = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
    const lum = new Float32Array(width * height);
    for (let i = 0; i < width * height; i++)
      lum[i] = 0.2126 * (px[i * 4] ?? 0) + 0.7152 * (px[i * 4 + 1] ?? 0) + 0.0722 * (px[i * 4 + 2] ?? 0);
    const sorted = [...lum].sort((a, b) => a - b);
    const at = (q: number) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))] ?? 0;
    const lumAt = (x: number, y: number) => lum[y * width + x] ?? 0;
    let step = 0;
    for (let y = 0; y < height; y++)
      for (let x = 1; x < width; x++) step = Math.max(step, Math.abs(lumAt(x, y) - lumAt(x - 1, y)));
    for (let y = 1; y < height; y++)
      for (let x = 0; x < width; x++) step = Math.max(step, Math.abs(lumAt(x, y) - lumAt(x, y - 1)));
    const mean = lum.reduce((a, b) => a + b, 0) / lum.length;
    return { mean, spread: at(0.95) - at(0.05), step };
  }, png.toString("base64"));
}

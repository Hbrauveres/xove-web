import { describe, expect, it } from "vitest";
import { fadeMask, falloff } from "./fade-mask.util";
import { glowLayout } from "./glow-layout.util";

describe("the light's fade mask", () => {
  const l = glowLayout(64, 36);
  /** The mask's alpha at a pixel; -1 off the canvas. */
  const alphaAt = (m: Uint8ClampedArray, x: number, y: number) => m[y * l.width + x] ?? -1;

  it("fades to exactly nothing at the reach, with nothing past it to cut, and lights everything under the stage", () => {
    const m = fadeMask(l);
    const { x, y, w, h } = l.stage;
    for (let px = 0; px < l.width; px++) expect(alphaAt(m, px, 0) + alphaAt(m, px, l.height - 1)).toBe(0);
    for (let py = 0; py < l.height; py++) expect(alphaAt(m, 0, py) + alphaAt(m, l.width - 1, py)).toBe(0);
    expect(alphaAt(m, x + w / 2, y + h / 2)).toBe(255);
    // 16 cells out (32 px) from the right edge: gone.
    expect(alphaAt(m, x + w + 32, y + h / 2)).toBe(0);
  });

  it("fades smoothly outward: never brighter further out, and no big steps", () => {
    const m = fadeMask(l);
    const { x, y, w, h } = l.stage;
    const row = y + h / 2;
    let last = 255;
    for (let px = x + w; px < l.width; px++) {
      const a = alphaAt(m, px, row);
      expect(a).toBeLessThanOrEqual(last + 1); // the grain may lift a level
      expect(last - a).toBeLessThanOrEqual(30);
      last = a;
    }
  });

  it("wraps round the corners: as bright diagonally out from a corner as straight out from a side", () => {
    const m = fadeMask(l);
    const { x, y } = l.stage;
    const d = 10;
    const straight = alphaAt(m, x - d, y + 30);
    const diagonal = alphaAt(m, x - Math.round(d / Math.SQRT2), y - Math.round(d / Math.SQRT2));
    expect(Math.abs(straight - diagonal)).toBeLessThanOrEqual(4);
    expect(diagonal).toBeGreaterThan(0);
  });

  it("uses the same grain every time, so the dark shades don't shimmer", () => {
    expect(fadeMask(l)).toEqual(fadeMask(l));
  });

  it("falls off strong near the frame, with a long tail, to exactly zero", () => {
    expect(falloff(0)).toBe(1);
    expect(falloff(1)).toBe(0);
    expect(falloff(0.5)).toBeGreaterThan(falloff(0.6));
    expect(falloff(0.95)).toBeGreaterThan(0);
  });
});

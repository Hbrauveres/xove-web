import { describe, expect, it } from "vitest";
import { GAPS, STRENGTH, bandLight, onScreen } from "./staticBands";

/** The bands down a stage `rows` tall, at 20 even points, `s` seconds in. */
const bands = (rows: number, s: number) => Array.from({ length: 20 }, (_, i) => bandLight(Math.round((i / 20) * rows) / rows, s));

describe("the standby screen's static bands (spec 0136)", () => {
  it("stays within black and white, its gaps dimmer snow, never black", () => {
    for (let s = 0; s < 30; s += 0.37) {
      for (let y = 0; y <= 1; y += 0.01) {
        const light = bandLight(y, s);
        expect(light).toBeLessThanOrEqual(1);
        // The gaps at 40% of the bands, less the shimmer's dip (to 64%) at most.
        expect(light).toBeGreaterThanOrEqual(GAPS * 0.64 - 1e-9);
      }
    }
  });

  it("draws the same bands on a phone's stage as on a desktop's, scaled to its height", () => {
    // A phone's stage is about 309 grains tall; a desktop's about 575. Each row lands a fraction of a
    // row apart, so they match within a band's edge.
    const phone = bands(309, 4.2);
    const desktop = bands(575, 4.2);
    phone.forEach((v, i) => expect(Math.abs(v - desktop[i])).toBeLessThan(0.15));
  });

  it("moves: the same height is lit differently a moment later", () => {
    const now = bands(575, 3);
    const later = bands(575, 3.3);
    expect(now).not.toEqual(later);
  });

  it("lights the room no brighter than the static looks on the screen", () => {
    expect(onScreen(1)).toBeCloseTo(0.5 * STRENGTH);
    expect(onScreen(0.4)).toBeLessThan(onScreen(1));
  });
});

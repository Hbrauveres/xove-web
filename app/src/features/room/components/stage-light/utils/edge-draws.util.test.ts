import { describe, expect, it } from "vitest";
import { edgeDraws } from "./edge-draws.util";
import { glowLayout } from "./glow-layout.util";

describe("the picture's edges on the light's canvas", () => {
  const l = glowLayout(64, 36);

  it("draws the picture in nine pieces that tile the canvas, corners from the picture's corners", () => {
    const draws = edgeDraws(l, 1920, 1080);
    expect(draws).toHaveLength(9);
    // Every canvas pixel is drawn exactly once: no gap, no dent at the corners.
    const hits = new Uint8Array(l.width * l.height);
    for (const {
      dst: [dx, dy, dw, dh],
    } of draws) {
      for (let y = dy; y < dy + dh; y++)
        for (let x = dx; x < dx + dw; x++) hits.set([(hits[y * l.width + x] ?? 0) + 1], y * l.width + x);
    }
    expect(hits.every((n) => n === 1)).toBe(true);
    const from = (name: string) => draws.find((d) => d.at === name)?.src;
    expect(from("top-left")?.slice(0, 2)).toEqual([0, 0]);
    expect(from("bottom-right")?.slice(0, 2)).toEqual([1920 - 6, 1080 - 6]);
    expect(from("stage")).toEqual([0, 0, 1920, 1080]);
  });

  it("never takes a strip thicker than a tiny picture", () => {
    const top = edgeDraws(l, 4, 3).find((d) => d.at === "top");
    expect(top?.src).toEqual([0, 0, 4, 3]);
  });
});

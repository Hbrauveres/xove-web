import { describe, expect, it } from "vitest";
import { centreX, centreY, inside, overlap, type Box } from "./geometry.ts";

const box = (x: number, y: number, width: number, height: number): Box => ({ x, y, width, height });

describe("inside", () => {
  it("is a box whole within another, the inner one first", () => {
    expect(inside(box(10, 10, 20, 20), box(0, 0, 100, 100))).toBe(true);
    expect(inside(box(0, 0, 100, 100), box(10, 10, 20, 20))).toBe(false);
  });

  it("allows half a pixel of rounding at an edge, not more", () => {
    expect(inside(box(-0.4, 0, 100.8, 10), box(0, 0, 100, 10))).toBe(true);
    expect(inside(box(-1, 0, 10, 10), box(0, 0, 100, 10))).toBe(false);
  });
});

describe("overlap", () => {
  it("is two boxes sharing some area", () => {
    expect(overlap(box(0, 0, 10, 10), box(5, 5, 10, 10))).toBe(true);
  });

  it("isn't two boxes only touching, nor apart", () => {
    expect(overlap(box(0, 0, 10, 10), box(10, 0, 10, 10))).toBe(false);
    expect(overlap(box(0, 0, 10, 10), box(0, 30, 10, 10))).toBe(false);
  });
});

describe("a centre", () => {
  it("is the middle of a box, across and down", () => {
    expect(centreX(box(10, 0, 20, 4))).toBe(20);
    expect(centreY(box(0, 10, 4, 30))).toBe(25);
  });
});

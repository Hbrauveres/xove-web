import { expect, it } from "vitest";
import { ease, easeBack, easeIn, easeOut } from "./easing.util";

it("every ease starts at 0 and ends at 1", () => {
  for (const f of [ease, easeIn, easeOut, easeBack]) {
    expect(f(0)).toBeCloseTo(0);
    expect(f(1)).toBeCloseTo(1);
  }
});

it("the ease is half way at the middle, and the spring goes past 1 before it settles", () => {
  expect(ease(0.5)).toBeCloseTo(0.5);
  expect(Math.max(...[0.7, 0.8, 0.9].map(easeBack))).toBeGreaterThan(1);
});

import { describe, expect, it } from "vitest";
import { grainOf } from "./grain.util";

describe("the grain", () => {
  it("is the same sequence for the same seed, between 0 and 1", () => {
    const a = grainOf(118);
    const b = grainOf(118);
    const draws = Array.from({ length: 50 }, () => a());
    expect(draws).toEqual(Array.from({ length: 50 }, () => b()));
    expect(draws.every((n) => n >= 0 && n < 1)).toBe(true);
  });

  it("differs for another seed", () => {
    expect(grainOf(1)()).not.toBe(grainOf(2)());
  });
});

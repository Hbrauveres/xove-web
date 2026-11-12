import { describe, expect, it } from "vitest";
import { grainFor } from "./grain-size.util";

describe("the static's grain", () => {
  it("is 1.5 px on a desktop's stage", () => {
    expect(grainFor(1532)).toBe(1.5);
  });

  it("is finer on a phone's stage, down to half", () => {
    expect(grainFor(412)).toBe(0.75);
    expect(grainFor(200)).toBe(0.75);
  });

  it("is coarser on a very wide stage, so it keeps about 1066 grains across", () => {
    expect(3200 / grainFor(3200)).toBeCloseTo(1066);
  });
});

import { describe, expect, it } from "vitest";
import { easeFor } from "./ease.util";

describe("the light's easing", () => {
  it("eases the same per second whatever the update rate, above the floor", () => {
    const left = (hz: number) => (1 - easeFor(1000 / hz, 120)) ** hz;
    expect(left(60)).toBeCloseTo(left(30), 6);
  });

  it("eases by time, not by frame, never below the 8-bit floor", () => {
    expect(easeFor(1000 / 60, 120)).toBeCloseTo(1 - Math.exp(-1000 / 60 / 120), 5);
    expect(easeFor(1000 / 30, 120)).toBeCloseTo(1 - Math.exp(-1000 / 30 / 120), 5);
    expect(easeFor(2, 120)).toBe(0.12);
    expect(easeFor(16, 0)).toBe(1);
  });
});

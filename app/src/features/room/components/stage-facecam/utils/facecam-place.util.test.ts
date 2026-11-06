import { describe, expect, it } from "vitest";
import { clampPlace, clampShare } from "./facecam-place.util";

describe("the facecam's place", () => {
  it("stays between the player's edge and how far it can go", () => {
    expect(clampShare(-0.2, 0.7)).toBe(0);
    expect(clampShare(0.9, 0.7)).toBe(0.7);
    expect(clampPlace({ x: 0.5, y: 2 }, 0.7, 0.6)).toEqual({ x: 0.5, y: 0.6 });
  });

  it("keeps four decimals, and never goes below 0 when the facecam is bigger than the player", () => {
    expect(clampShare(0.123456, 1)).toBe(0.1235);
    expect(clampShare(0.3, -0.1)).toBe(0);
  });
});

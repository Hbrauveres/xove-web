import { describe, expect, it } from "vitest";
import { secondsLeft } from "./seconds-left.util";

describe("seconds left", () => {
  it("rounds a part of a second up, and never goes below zero", () => {
    expect(secondsLeft(10_000, 0)).toBe(10);
    expect(secondsLeft(10_000, 500)).toBe(10);
    expect(secondsLeft(10_000, 9_001)).toBe(1);
    expect(secondsLeft(10_000, 12_000)).toBe(0);
  });
});

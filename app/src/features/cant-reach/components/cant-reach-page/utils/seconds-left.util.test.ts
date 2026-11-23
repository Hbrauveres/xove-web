import { describe, expect, it } from "vitest";
import { secondsLeft } from "./seconds-left.util";

describe("the seconds left to the next try", () => {
  it("rounds up, so the count shows 1 until the try, then 0", () => {
    expect(secondsLeft(10_000, 2_000)).toBe(8);
    expect(secondsLeft(10_000, 9_001)).toBe(1);
    expect(secondsLeft(10_000, 10_000)).toBe(0);
    expect(secondsLeft(10_000, 12_000)).toBe(0);
  });
});

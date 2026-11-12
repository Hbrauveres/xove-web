import { describe, expect, it } from "vitest";
import { twoDigits } from "./two-digits.util";

describe("twoDigits", () => {
  it("pads a clock's number to two digits", () => {
    expect(twoDigits(7)).toBe("07");
    expect(twoDigits(42)).toBe("42");
  });
});

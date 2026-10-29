import { describe, expect, it } from "vitest";
import { hueOf } from "./person-colour.util";

describe("a person's colour", () => {
  it("is the same for the same person, and on the colour wheel", () => {
    expect(hueOf("user-42")).toBe(hueOf("user-42"));
    for (const id of ["user-1", "user-2", "user-42", "user-1000"]) {
      expect(hueOf(id)).toBeGreaterThanOrEqual(0);
      expect(hueOf(id)).toBeLessThan(360);
    }
  });

  it("puts people whose ids differ only at the end far apart", () => {
    const gap = Math.abs(hueOf("user-3") - hueOf("user-4"));
    expect(Math.min(gap, 360 - gap)).toBeGreaterThan(30);
  });

  it("keeps the colours everyone already has", () => {
    expect([hueOf("user-2"), hueOf("user-3"), hueOf("user-42")]).toEqual([11, 149, 166]);
  });
});

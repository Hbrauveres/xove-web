import { describe, expect, it } from "vitest";
import { fillsBox } from "./fills-box.util";

describe("a picture filling its box", () => {
  it("fills when the shapes match within 1%", () => {
    expect(fillsBox(1756.44 / 987.98, 1920 / 1080)).toBe(true);
  });

  it("keeps its bars when the shapes differ, or before it has a size", () => {
    expect(fillsBox(1600 / 900, 1080 / 1920)).toBe(false);
    expect(fillsBox(16 / 9, 0 / 0)).toBe(false);
    expect(fillsBox(0 / 0, 16 / 9)).toBe(false);
  });
});

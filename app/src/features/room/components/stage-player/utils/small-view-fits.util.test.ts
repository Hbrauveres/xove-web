import { describe, expect, it } from "vitest";
import { smallViewFits } from "./small-view-fits.util";

describe("whether the small view fits the picture", () => {
  it("fits any picture its buttons fit on, at the picture's whole width", () => {
    expect(smallViewFits(390)).toBe(true);
    expect(smallViewFits(84)).toBe(true);
  });

  it("doesn't fit a narrower one", () => {
    expect(smallViewFits(83)).toBe(false);
  });

  it("fits while the picture's width is unknown", () => {
    expect(smallViewFits(null)).toBe(true);
  });
});

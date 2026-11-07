import { describe, expect, it } from "vitest";
import { smallViewFits } from "./small-view-fits.util";

describe("whether the small view fits the picture", () => {
  it("fits a picture at least twice its narrowest", () => {
    expect(smallViewFits(390)).toBe(true);
    expect(smallViewFits(168)).toBe(true);
  });

  it("doesn't fit a narrower one", () => {
    expect(smallViewFits(167)).toBe(false);
  });

  it("fits while the picture's width is unknown", () => {
    expect(smallViewFits(null)).toBe(true);
  });
});

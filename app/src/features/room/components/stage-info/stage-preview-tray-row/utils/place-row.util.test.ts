import { describe, expect, it } from "vitest";
import { placeRow } from "./place-row.util";

const picture = (top: number, height = 72) => new DOMRect(100, top, 128, height);

describe("placeRow", () => {
  it("goes under its picture, as wide as it, when there's room", () => {
    expect(placeRow(picture(100), 40, 1080, null)).toEqual({ below: true, left: 100, width: 128, top: 178 });
  });

  it("goes above it near the window's bottom", () => {
    expect(placeRow(picture(1000), 40, 1080, null)).toEqual({ below: false, left: 100, width: 128, bottom: 86 });
  });

  it("keeps the side it chose", () => {
    expect(placeRow(picture(1000), 40, 1080, true).below).toBe(true);
  });
});

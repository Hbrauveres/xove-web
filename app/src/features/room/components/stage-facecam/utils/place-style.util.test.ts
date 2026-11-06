import { describe, expect, it } from "vitest";
import { placeStyle } from "./place-style.util";

describe("where the facecam is drawn", () => {
  it("is its place as percentages of the player", () => {
    expect(placeStyle({ x: 0.7, y: 0.6 })).toEqual({ left: "70%", top: "60%" });
  });
});

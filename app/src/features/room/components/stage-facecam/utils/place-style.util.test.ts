import { describe, expect, it } from "vitest";
import { placeStyle } from "./place-style.util";

describe("where the facecam is drawn", () => {
  it("is its place as percentages of the player, never past its right edge", () => {
    expect(placeStyle({ x: 0.7, y: 0.6 })).toEqual({ left: "min(70%, 100% - var(--small-view-width))", top: "60%" });
  });
});

import { describe, expect, it } from "vitest";
import { gridFor, gridKey } from "./light-grid.util";

describe("the light's grid follows the stage's shape", () => {
  it("is 64×36 at 16:9", () => {
    expect(gridFor(16 / 9)).toEqual({ cols: 64, rows: 36 });
  });

  it("turns for a portrait picture: 36 across, 64 down", () => {
    expect(gridFor(9 / 16)).toEqual({ cols: 36, rows: 64 });
  });

  it("keeps the cells square, 36 along the shorter side", () => {
    expect(gridFor(21 / 9)).toEqual({ cols: 84, rows: 36 });
    expect(gridFor(1)).toEqual({ cols: 36, rows: 36 });
  });

  it("never goes past 96 cells along the longer side", () => {
    expect(gridFor(4)).toEqual({ cols: 96, rows: 36 });
    expect(gridFor(1 / 4)).toEqual({ cols: 36, rows: 96 });
  });

  it("names each grid, the same for shapes that share it", () => {
    expect(gridKey(16 / 9)).toBe("64x36");
    expect(gridKey(1.78)).toBe(gridKey(16 / 9));
    expect(gridKey(9 / 16)).toBe("36x64");
  });
});

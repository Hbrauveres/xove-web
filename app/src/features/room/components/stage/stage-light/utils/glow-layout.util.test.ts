import { describe, expect, it } from "vitest";
import { gridFor } from "../../../../utils/light-grid.util";
import { MARGIN, SPREAD } from "../constants/stage-light.constants";
import { glowLayout } from "./glow-layout.util";

describe("the light's canvas", () => {
  it("lays the glow out at 2 px a cell: the 16-cell reach, then a 3-cell margin, round the stage", () => {
    const l = glowLayout(64, 36);
    expect([l.width, l.height]).toEqual([(64 + 38) * 2, (36 + 38) * 2]);
    expect(l.stage).toEqual({ x: 38, y: 38, w: 128, h: 72 });
    expect(l.placement.left).toBe(`${(-19 / 64) * 100}%`);
    expect(l.placement.height).toBe(`${(74 / 36) * 100}%`);
  });

  it("places the canvas so the glow reaches as far on every side", () => {
    const { cols, rows } = gridFor(9 / 16);
    const { placement } = glowLayout(cols, rows);
    // The reach and the margin beyond each edge; the cells are square, so the same distance in pixels.
    expect(parseFloat(placement.left)).toBeCloseTo((-(SPREAD + MARGIN) / 36) * 100);
    expect(parseFloat(placement.top)).toBeCloseTo((-(SPREAD + MARGIN) / 64) * 100);
  });
});

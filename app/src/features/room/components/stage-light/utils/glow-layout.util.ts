import { CELL_PX, MARGIN, PERCENT, SIDES, SPREAD } from "../constants/stage-light.constants";
import type { GlowLayout } from "../types/stage-light.types";

/** The light's canvas for a grid: the reach and a margin round the stage, at 2 px a cell. */
export function glowLayout(cols: number, rows: number): GlowLayout {
  const off = SPREAD + MARGIN;
  return {
    width: (cols + off * SIDES) * CELL_PX,
    height: (rows + off * SIDES) * CELL_PX,
    stage: { x: off * CELL_PX, y: off * CELL_PX, w: cols * CELL_PX, h: rows * CELL_PX },
    placement: {
      left: `${(-off / cols) * PERCENT}%`,
      width: `${((cols + off * SIDES) / cols) * PERCENT}%`,
      top: `${(-off / rows) * PERCENT}%`,
      height: `${((rows + off * SIDES) / rows) * PERCENT}%`,
    },
  };
}

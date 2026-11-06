import { MAX_CELLS, ROWS } from "../constants/light-grid.constants";
import type { LightGrid } from "../types/light-grid.types";

/**
 * The light's grid for a stage of shape `r` (width ÷ height): square cells, 36 of them along the
 * shorter side, so the light reaches as far beyond every edge. 64×36 at 16:9.
 */
export function gridFor(r: number): LightGrid {
  const long = (k: number) => Math.min(MAX_CELLS, Math.round(ROWS * k));
  return r >= 1 ? { cols: long(r), rows: ROWS } : { cols: ROWS, rows: long(1 / r) };
}

/** A name for a stage shape's grid: a new grid starts a fresh light. */
export function gridKey(shape: number): string {
  const { cols, rows } = gridFor(shape);
  return `${cols}x${rows}`;
}

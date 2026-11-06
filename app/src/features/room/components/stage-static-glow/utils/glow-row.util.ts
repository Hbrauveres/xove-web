import { MS_PER_SECOND } from "@shared/constants/time.constants";
import { bandLight, onScreen } from "../../../utils/static-bands.util";
import { FULL, ROW_MIDDLE, TINT_GREEN, TINT_RED } from "../constants/static-glow.constants";

/**
 * The colour of row `y` of `rows`, `t` ms in: as bright as the static looks on the screen at that
 * height, never brighter (the light comes from it), with a touch of blue.
 */
export function glowRowColour(y: number, rows: number, t: number): string {
  const v = onScreen(bandLight((y + ROW_MIDDLE) / rows, t / MS_PER_SECOND)) * FULL;
  return `rgb(${(v * TINT_RED) | 0}, ${(v * TINT_GREEN) | 0}, ${v | 0})`;
}

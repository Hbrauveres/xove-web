import { ACROSS, DESKTOP_WIDTH, FINEST, GRAIN } from "../constants/static-noise.constants";

/** How many CSS pixels one grain takes on a stage this wide: finer on a small stage, coarser on a very wide one. */
export function grainFor(width: number): number {
  return Math.max(Math.min(GRAIN, Math.max(GRAIN * FINEST, width / DESKTOP_WIDTH)), width / ACROSS);
}

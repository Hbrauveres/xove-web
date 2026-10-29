import { HOLD_MS, LEVEL_STRETCH } from "./devices.constants";
import type { GateState } from "./devices.types";

/** The level of a stretch of samples, 0 to 1: the meter's own scale, so the gate's line means the same. */
export function levelOf(samples: Float32Array): number {
  let sum = 0;
  for (const s of samples) sum += s * s;
  return Math.min(1, Math.sqrt(sum / (samples.length || 1)) * LEVEL_STRETCH);
}

/**
 * One reading of the noise gate: sound under the line isn't sent. It opens at once when the
 * level crosses the line and stays open `HOLD_MS` after it drops back. `dt`: ms since the last one.
 */
export function gateStep(state: GateState, level: number, line: number, dt: number): GateState {
  if (line <= 0 || level >= line) return { open: true, heldFor: 0 };
  if (!state.open) return state;
  const heldFor = state.heldFor + dt;
  return heldFor >= HOLD_MS ? { open: false, heldFor: 0 } : { open: true, heldFor };
}

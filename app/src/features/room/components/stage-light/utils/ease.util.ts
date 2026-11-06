import { EASE_FLOOR } from "../constants/stage-light.constants";

/** How far an update eases towards the new picture after `dt` ms, for a time constant `tau` ms. */
export function easeFor(dt: number, tau: number): number {
  if (tau <= 0) return 1;
  return Math.min(1, Math.max(EASE_FLOOR, 1 - Math.exp(-dt / tau)));
}

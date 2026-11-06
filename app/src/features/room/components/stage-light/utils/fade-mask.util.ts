import { CELL_PX, FALLOFF_RATE, GRAIN_LEVELS, GRAIN_SEED, OPAQUE, SPREAD } from "../constants/stage-light.constants";
import type { GlowLayout } from "../types/stage-light.types";
import { grainOf } from "./grain.util";

/** A pixel's centre, from its index. */
const HALF = 0.5;

/** The light's strength at `s` of the reach: strong at the frame, a long tail, exactly zero at 1, with no kink. */
export function falloff(s: number): number {
  if (s <= 0) return 1;
  if (s >= 1) return 0;
  return Math.exp(-FALLOFF_RATE * s) * (1 - s * s * s);
}

/**
 * The fade mask's alpha, one byte per canvas pixel: opaque under the stage, the falloff by
 * distance from the frame (the corners measured from the corner, so the light wraps round),
 * zero from the reach on, plus a fixed grain so the darkest shades don't band.
 */
export function fadeMask(l: GlowLayout): Uint8ClampedArray {
  const { width, height, stage } = l;
  const reach = SPREAD * CELL_PX;
  const grain = grainOf(GRAIN_SEED);
  const out = new Uint8ClampedArray(width * height);
  for (let py = 0; py < height; py++) {
    const cy = py + HALF;
    const dy = Math.max(stage.y - cy, 0, cy - (stage.y + stage.h));
    for (let px = 0; px < width; px++) {
      const cx = px + HALF;
      const dx = Math.max(stage.x - cx, 0, cx - (stage.x + stage.w));
      const s = Math.hypot(dx, dy) / reach;
      const g = (grain() - HALF) * GRAIN_LEVELS;
      out[py * width + px] = s >= 1 ? 0 : s <= 0 ? OPAQUE : Math.round(falloff(s) * OPAQUE + g);
    }
  }
  return out;
}

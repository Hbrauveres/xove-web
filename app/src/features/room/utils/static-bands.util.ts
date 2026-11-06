import { HALF } from "../constants/math.constants";
import {
  EDGE_START,
  EDGE_WIDTH,
  GAPS,
  MEAN,
  NARROW_BANDS,
  NARROW_DRIFT,
  NARROW_DRIFT_RATE,
  REF_HEIGHT,
  ROLL,
  SHIMMER_FLOOR,
  SHIMMER_RATE,
  SHIMMER_SPREAD,
  SMOOTH_CUBE,
  SMOOTH_SQUARE,
  STRENGTH,
  WAVER_FAST_PX,
  WAVER_FAST_RATE,
  WAVER_SLOW_PX,
  WAVER_SLOW_RATE,
  WIDE_BANDS,
  WIDE_SHARE,
} from "../constants/static-bands.constants";

/** A wave from -1 to 1, as a share from 0 to 1. */
const share = (wave: number) => (wave + 1) * HALF;
/** A smooth step from 0 to 1: 3t² − 2t³. */
const smooth = (t: number) => t * t * (SMOOTH_SQUARE - SMOOTH_CUBE * t);

/**
 * How bright the static looks on the stage at a band's brightness `light` (0–1): what its light
 * round the stage may reach.
 */
export function onScreen(light: number): number {
  return light * MEAN * STRENGTH;
}

/**
 * The empty stage's static: how bright it is (0–1) at `y`, a share of the stage's height from its
 * top, `s` seconds into the page's life. The bands roll down together, keeping their sizes; the
 * picture wavers up and down a little, as a TV losing its vertical hold, and each band shimmers.
 * The gaps between them are dimmer snow, never black. Shared by the static and its light round the
 * stage, so the two roll together.
 */
export function bandLight(y: number, s: number): number {
  const waver = Math.sin(s * WAVER_SLOW_RATE) * WAVER_SLOW_PX + Math.sin(s * WAVER_FAST_RATE) * WAVER_FAST_PX;
  const roll = y * REF_HEIGHT - s * ROLL + waver;
  const wide = share(Math.sin(roll * WIDE_BANDS));
  const narrow = share(Math.sin(roll * NARROW_BANDS + Math.sin(s * NARROW_DRIFT_RATE) * NARROW_DRIFT));
  const shimmer = SHIMMER_FLOOR + (1 - SHIMMER_FLOOR) * Math.sin(s * SHIMMER_RATE + roll * SHIMMER_SPREAD);
  const pattern = wide * WIDE_SHARE + narrow * (1 - WIDE_SHARE);
  const edge = Math.min(1, Math.max(0, (pattern - EDGE_START) / EDGE_WIDTH));
  return (GAPS + (1 - GAPS) * smooth(edge)) * shimmer;
}

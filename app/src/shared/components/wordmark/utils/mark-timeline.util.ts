/**
 * The wordmark's hover animation, as a function of time:
 * 1. the left corners stay; the letters slide left under them until the X is gone, while the
 *    right corners close in to the O;
 * 2. the top and bottom corners settle where the icon has them;
 * 3. the dot blinks twice, like a surprised eye: shut fast, open a little slower, and the
 *    second time it springs slightly wide before settling;
 * 4. everything goes back.
 */
import { FRAME_DECIMALS, MS, SHUT, SPRING, WIDE } from "../constants/mark-timeline.constants.ts";
import type { Frame } from "../types/mark.types.ts";
import { ease, easeBack, easeIn, easeOut } from "./easing.util.ts";

type Step = { ms: number; at: (t: number) => Frame };
const still = (slide: number, settle: number): Frame => ({ slide, settle, eye: { sx: 1, sy: 1 } });
const eye = (sx: number, sy: number): Frame => ({ slide: 1, settle: 1, eye: { sx, sy } });
const shutting = (t: number) => eye(1 + (WIDE - 1) * easeIn(t), 1 - (1 - SHUT) * easeIn(t));

const STEPS: Step[] = [
  { ms: MS.slide, at: (t) => still(ease(t), 0) },
  { ms: MS.settle, at: (t) => still(1, ease(t)) },
  { ms: MS.pause, at: () => still(1, 1) },
  { ms: MS.close1, at: shutting },
  { ms: MS.open1, at: (t) => eye(WIDE - (WIDE - 1) * easeOut(t), SHUT + (1 - SHUT) * easeOut(t)) },
  { ms: MS.between, at: () => still(1, 1) },
  { ms: MS.close2, at: shutting },
  {
    ms: MS.open2,
    at: (t) => {
      const k = easeBack(t);
      return eye(WIDE - (WIDE - 1) * k + SPRING.late * Math.max(0, t - SPRING.from), SHUT + (1 - SHUT) * k);
    },
  },
  // From where the spring left it (a touch wide) back to round.
  { ms: MS.calm, at: (t) => eye(1 + SPRING.rest * (1 - easeOut(t)), 1) },
  { ms: MS.hold, at: () => still(1, 1) },
  { ms: MS.settle, at: (t) => still(1, 1 - ease(t)) },
  { ms: MS.slide, at: (t) => still(1 - ease(t), 0) },
];

export const TOTAL_MS = STEPS.reduce((sum, s) => sum + s.ms, 0);

const kept = (v: number) => +v.toFixed(FRAME_DECIMALS);
const round = (f: Frame): Frame => ({
  slide: kept(f.slide),
  settle: kept(f.settle),
  eye: { sx: kept(f.eye.sx), sy: kept(f.eye.sy) },
});

export function frameAt(ms: number): Frame {
  if (ms <= 0 || ms >= TOTAL_MS) return still(0, 0);
  let start = 0;
  for (const step of STEPS) {
    if (ms < start + step.ms) return round(step.at((ms - start) / step.ms));
    start += step.ms;
  }
  return still(0, 0);
}

import { EASE, SPRING } from "../constants/mark-timeline.constants.ts";

/** Slow, fast, slow. */
export const ease = (t: number) =>
  t < EASE.middle ? EASE.steep * t ** EASE.power : 1 - (-EASE.double * t + EASE.double) ** EASE.power / EASE.double;
export const easeIn = (t: number) => t ** EASE.power;
export const easeOut = (t: number) => 1 - (1 - t) ** EASE.power;
/** Past 1, then back: a small spring. */
export const easeBack = (t: number) => 1 + SPRING.past * (t - 1) ** EASE.power + SPRING.bend * (t - 1) ** EASE.double;

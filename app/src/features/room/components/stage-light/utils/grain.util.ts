import {
  MULBERRY_ODD,
  MULBERRY_SHIFT_A as a,
  MULBERRY_SHIFT_B as b,
  MULBERRY_SHIFT_C as c,
  MULBERRY_STEP,
  UINT32_RANGE,
} from "../constants/grain.constants";

/** A fixed pseudo-random sequence from 0 to 1 (mulberry32): the same grain every time. */
export function grainOf(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + MULBERRY_STEP) | 0;
    let t = Math.imul(state ^ (state >>> a), 1 | state);
    t = (t + Math.imul(t ^ (t >>> b), MULBERRY_ODD | t)) ^ t;
    return ((t ^ (t >>> c)) >>> 0) / UINT32_RANGE;
  };
}

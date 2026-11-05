/** Each step of the animation, in ms. */
export const MS = {
  slide: 600,
  settle: 380,
  pause: 160,
  hold: 320,
  close1: 80,
  open1: 130,
  between: 70,
  close2: 70,
  open2: 240,
  calm: 260,
} as const;
/** The dot's squash: nearly shut, and a little wide as it springs. */
export const SHUT = 0.06;
export const WIDE = 1.08;
/** The spring after the second blink: how far past, how it bends, and how wide it ends. */
export const SPRING = { past: 2.4, bend: 1.4, late: 0.1, from: 0.6, rest: 0.04 } as const;
/** The ease's turning point and its curve. */
export const EASE = { middle: 0.5, steep: 4, power: 3, double: 2 } as const;
/** Decimal places kept in a frame. */
export const FRAME_DECIMALS = 4;

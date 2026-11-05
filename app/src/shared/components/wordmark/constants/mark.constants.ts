/** The grid every part of the mark is drawn on: the letters' cap height, and their stroke. */
export const CAP = 100;
export const STROKE = 10;
/** Halves, for centres and stroke edges. */
export const HALF = 0.5;
/** How far the viewfinder sits from the letters, across and up and down. */
export const PAD = 28;
/** Each corner's arm, in the wordmark and in the icon. */
export const ARM = 24;
const ICON_ARM = 26;
/** The letters' widths, and the space between them. */
export const WIDTH = { X: 88, O: 100, V: 90, E: 68 } as const;
export const GAP = 20;
/** The V runs past the cap height and is cut flat there: how far past, and how far out at its tips. */
export const V_PAST = { out: 2, top: -30, bottom: 12 } as const;
/** How much shorter the E's middle bar is than its arms. */
export const E_BAR_SHORT = 7;
/** The record dot's radius in an O 100 across. */
export const DOT_R = 29.4;
/** The icon's frame around its O, from each frame line to the O's edge. */
export const ICON_SPACING = { left: 15, right: 14, top: 18, bottom: 18 } as const;
/**
 * The symbol drawn for its size. Large (64 px and up) is the slim mark with room around it; small
 * (32 px) and tiny (16 px, the tab) get heavier strokes, longer corners and fill more of their square,
 * so they read from afar. `fill` is how much of the square's height the symbol takes.
 */
export const OPTICAL = {
  large: { stroke: 10, arm: ICON_ARM, dot: DOT_R, fill: 0.7 },
  small: { stroke: 12, arm: 28, dot: DOT_R, fill: 0.84 },
  tiny: { stroke: 16, arm: 32, dot: 31, fill: 1 },
} as const;
/** The letters' clip: the area they show in, wide enough for the animation's slide. */
export const WIPE = { top: -40, height: 180 } as const;
/** A corner's miter limit, so its sharp end is never cut. */
export const MITER = 10;
/** Decimal places kept in the drawn numbers. */
export const DECIMALS = 2;

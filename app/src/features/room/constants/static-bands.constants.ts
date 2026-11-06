/** The bands are drawn for a stage this tall (a desktop's) and scaled to the real one. */
export const REF_HEIGHT = 860;
/** How fast the bands roll down, in pixels of that stage a second. */
export const ROLL = 24;
/** How bright the gaps between the bands are, against the bands themselves. */
export const GAPS = 0.4;
/** How strongly the static shows over the stage's dark (its canvas's opacity). */
export const STRENGTH = 0.17;
/** Snow is half lit on average: a grain is anything from black to white. */
export const MEAN = 0.5;
/**
 * The picture wavers up and down as a TV losing its vertical hold: two sways, their speeds and
 * their sizes in pixels.
 */
export const WAVER_SLOW_RATE = 0.9;
export const WAVER_SLOW_PX = 14;
export const WAVER_FAST_RATE = 2.7;
export const WAVER_FAST_PX = 4;
/** The wide bands' and the narrow bands' spacing, and how the narrow ones drift. */
export const WIDE_BANDS = 0.03;
export const NARROW_BANDS = 0.009;
export const NARROW_DRIFT_RATE = 0.3;
export const NARROW_DRIFT = 0.35;
/** How much of the pattern the wide bands make; the narrow ones make the rest. */
export const WIDE_SHARE = 0.55;
/** Where a band's edge starts and how wide it is, on the pattern's 0–1 scale. */
export const EDGE_START = 0.42;
export const EDGE_WIDTH = 0.16;
/** Each band's brightness shimmers down to this, at this speed and spread. */
export const SHIMMER_FLOOR = 0.82;
export const SHIMMER_RATE = 1.9;
export const SHIMMER_SPREAD = 0.004;
/** Static flickers at this rate; more is wasted on a faded background. */
export const FLICKER_FPS = 20;
/** The smooth step's curve, 3t² − 2t³. */
export const SMOOTH_SQUARE = 3;
export const SMOOTH_CUBE = 2;

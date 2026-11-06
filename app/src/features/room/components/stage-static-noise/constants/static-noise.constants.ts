/** One grain of static is this many CSS pixels on a desktop's stage: fine, and easy on the eye. */
export const GRAIN = 1.5;
/** A smaller stage has a finer grain, scaled by its width against a desktop stage's this wide. */
export const DESKTOP_WIDTH = 1000;
/**
 * A stage wider than a desktop's keeps about this many grains across (a coarser grain), so a 4K
 * screen costs what a desktop does.
 */
export const ACROSS = 1066;
/** How much the glass bulges: the bands bow this much at the screen's sides (0 is flat). */
export const BULGE = 0.09;
/** xorshift's seed and shifts: fast enough for every grain, every frame. */
export const XORSHIFT_SEED = 0x9e3779b9;
export const XORSHIFT_A = 13;
export const XORSHIFT_B = 17;
export const XORSHIFT_C = 5;
/** A grain's brightness is the random word's top byte. */
export const TOP_BYTE = 24;
/** A grey pixel as one 32-bit word: opaque, and the same byte in red, green and blue. */
export const OPAQUE_PIXEL = 0xff000000;
export const RED_SHIFT = 16;
export const GREEN_SHIFT = 8;
/** The finest grain is half a desktop's. */
export const FINEST = 0.5;
/** Half: the picture's middle. */
export const HALF = 0.5;

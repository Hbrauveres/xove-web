import { MS_PER_SECOND } from "@shared/constants/time.constants";

/** How often the light updates, at most: the screens' usual refresh. */
const UPDATES_PER_SECOND = 60;
/** The canvas reaches past the stage on both sides. */
export const SIDES = 2;
/** A pixel's four bytes (red, green, blue, alpha), and where its alpha is. */
export const RGBA = 4;
export const ALPHA = 3;
/** How far the light reaches beyond the frame, in cells: about 44% of the stage's height at 16:9. */
export const SPREAD = 16;
/** Canvas pixels per cell. */
export const CELL_PX = 2;
/** Empty cells past the reach, so the fade ends inside the canvas and nothing is cut. */
export const MARGIN = 3;
/** How thick a strip of the picture's edge is stretched outward, in source pixels. */
export const STRIP = 6;
/** The blur over the stretched edges, in cells. */
export const BLUR_CELLS = 3;
/** How quickly the light falls off from the frame. */
export const FALLOFF_RATE = 3.4;
/** The grain over the fade mask: a fixed seed, and how far it moves a shade (±0.8 of a level). */
export const GRAIN_SEED = 118;
export const GRAIN_LEVELS = 1.6;
/** A pixel fully lit, in 8 bits. */
export const OPAQUE = 255;
/** The smallest easing step: drawing at less than this, 8-bit colours settle short of the target. */
export const EASE_FLOOR = 0.12;
/**
 * About 60 updates a second, on the screen's frames: a faster screen skips frames evenly, so
 * each update's easing stays above its 8-bit floor and the rate is 60 on any refresh rate.
 */
export const UPDATE_MS = MS_PER_SECOND / UPDATES_PER_SECOND;
/** A frame this early still counts as on time (frames never land exactly). */
export const ON_TIME_MS = 2;
/** With reduced motion, the light changes slowly instead: twice a second, a gentle step each time. */
export const SLOW_SAMPLE_MS = 500;
export const SLOW_EASE = 0.3;
/** The easing's time constant: after this long the light has gone about two thirds of the way. */
export const EASE_MS = 120;
/** A video's `readyState` once it has a picture to draw (HAVE_CURRENT_DATA). */
export const HAS_PICTURE = 2;
/** The events that say whether a video plays. */
export const PLAY_EVENTS = ["play", "playing", "pause", "ended", "emptied"];
/** A share as a CSS percentage. */
export const PERCENT = 100;

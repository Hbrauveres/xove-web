/** The stage's shape when there's no picture to follow: empty, or still loading. */
const SIXTEEN_NINE = { width: 16, height: 9 } as const;
export const WIDESCREEN = SIXTEEN_NINE.width / SIXTEEN_NINE.height;
/** Changes smaller than this (simulcast layers of the same window) don't move the stage. */
export const IGNORE_SHAPE = 0.01;

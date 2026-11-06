/** How far an arrow key moves the facecam, as a share of the player. */
const STEP = 0.05;
/** A place is kept to four decimals: a share of a pixel on any screen. */
export const PLACE_PRECISION = 10_000;
/** The arrow keys, and which way each moves the facecam. */
export const ARROWS: Record<string, { dx: number; dy: number }> = {
  ArrowLeft: { dx: -STEP, dy: 0 },
  ArrowRight: { dx: STEP, dy: 0 },
  ArrowUp: { dx: 0, dy: -STEP },
  ArrowDown: { dx: 0, dy: STEP },
};

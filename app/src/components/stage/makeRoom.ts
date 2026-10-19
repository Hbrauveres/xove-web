/** The space kept between the player and the top bar, and between the player and the sheet. */
export const ROOM_GAP = 8;
/** In the upright full-screen view, the settings sheet covers this much of the screen. */
export const FULL_VIEW_SHEET = 0.58;

type Sizes = {
  /** The screen's height. */
  height: number;
  /** The top bar's height. */
  bar: number;
  /** The open sheet's height. */
  sheet: number;
  /** The player's band (the video), where it is now. */
  band: { top: number; height: number };
};

/**
 * How far to move the player up when the settings sheet opens in the upright full-screen view
 * (spec 0107, design decision 6): into the middle of the space between the top bar and the
 * sheet, at the same size, so the sheet doesn't cover it. A player that doesn't fit there (a
 * vertical share) stays where it is, under the sheet: the video is never shrunk.
 */
export function makeRoom({ height, bar, sheet, band }: Sizes): number {
  const from = bar + ROOM_GAP;
  const to = height - sheet - ROOM_GAP;
  if (band.height > to - from) return 0;
  const top = from + (to - from - band.height) / 2;
  return Math.max(0, band.top - top);
}

/**
 * How far to move the round buttons (and the fullscreen button with them) up from the bottom of
 * the screen: to just above the sheet, so they're never left behind it (design decision 6).
 */
export function liftButtons({ rowBottom, sheetTop, max = Infinity }: { rowBottom: number; sheetTop: number; max?: number }): number {
  // `max`: no higher than the player's top edge (the upright normal view, spec 0118).
  return Math.max(0, Math.min(max, rowBottom - (sheetTop - ROOM_GAP)));
}

/** The space kept between the buttons and the open streams row under them (spec 0131). */
export const ROW_GAP = 6;

/**
 * How far to lift the buttons when the streams row opens sideways (spec 0131, design decision 15):
 * to `ROW_GAP` above its pictures, its fade on top left to the picture. `row` is its height, `fade`
 * the fade's, `under` how high the buttons' bottom sits from the screen's bottom without a lift.
 */
export function liftOverRow({ row, fade, under }: { row: number; fade: number; under: number }): number {
  return Math.max(0, Math.round(row - fade + ROW_GAP - under));
}

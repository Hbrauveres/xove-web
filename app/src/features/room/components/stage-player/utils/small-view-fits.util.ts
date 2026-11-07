import { SMALL_VIEW_MIN } from "../constants/stage-player.constants";

/**
 * Whether the small view fits on a picture this wide (px): it may take at most half of it, and never
 * less than its buttons need. An unknown width fits.
 */
export function smallViewFits(picture: number | null): boolean {
  return picture === null || picture >= 2 * SMALL_VIEW_MIN;
}

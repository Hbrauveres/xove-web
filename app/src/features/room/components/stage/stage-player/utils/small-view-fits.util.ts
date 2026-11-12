import { SMALL_VIEW_MIN } from "../constants/stage-player.constants";

/**
 * Whether the small view fits on a picture this wide (px): at most the picture's whole width, and
 * never less than its buttons need. An unknown width fits.
 */
export function smallViewFits(picture: number | null): boolean {
  return picture === null || picture >= SMALL_VIEW_MIN;
}

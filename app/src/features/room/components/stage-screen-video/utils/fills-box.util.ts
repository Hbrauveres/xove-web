import { SAME_SHAPE } from "../constants/screen-video.constants";

/**
 * Whether the picture fills its box: their shapes (width ÷ height) are the same within 1%. The
 * stage takes the picture's shape in fractional pixels, so a picture fitted inside stops a fraction
 * short of an edge and the black behind shows as a thin line; filling crops less than a pixel.
 */
export function fillsBox(box: number, picture: number): boolean {
  return Number.isFinite(box) && Number.isFinite(picture) && picture > 0 && Math.abs(picture / box - 1) < SAME_SHAPE;
}

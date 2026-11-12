import type { FacecamPlace } from "../../../../types/facecam.types";
import { PLACE_PRECISION } from "../constants/facecam.constants";

/** A share kept between 0 and `max`, to four decimals. */
export function clampShare(n: number, max: number): number {
  return Math.round(Math.min(Math.max(n, 0), Math.max(max, 0)) * PLACE_PRECISION) / PLACE_PRECISION;
}

/** A place kept whole inside the player. */
export function clampPlace(place: FacecamPlace, maxX: number, maxY: number): FacecamPlace {
  return { x: clampShare(place.x, maxX), y: clampShare(place.y, maxY) };
}

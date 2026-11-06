import type { CSSProperties } from "react";
import type { FacecamPlace } from "../../../types/facecam.types";
import { PERCENT } from "../constants/facecam.constants";

/** Where the facecam is drawn: its place as the player's percentages. */
export function placeStyle(place: FacecamPlace): CSSProperties {
  return { left: `${place.x * PERCENT}%`, top: `${place.y * PERCENT}%` };
}

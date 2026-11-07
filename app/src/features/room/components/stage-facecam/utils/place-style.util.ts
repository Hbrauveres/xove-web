import { PERCENT } from "../../../constants/math.constants";
import type { CSSProperties } from "react";
import type { FacecamPlace } from "../../../types/facecam.types";

/**
 * Where the facecam is drawn: its place as the player's percentages, never past its right edge, when
 * its minimum width (on a narrow picture) is more than the room its place leaves.
 */
export function placeStyle(place: FacecamPlace): CSSProperties {
  return { left: `min(${place.x * PERCENT}%, 100% - var(--small-view-width))`, top: `${place.y * PERCENT}%` };
}

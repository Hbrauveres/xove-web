import { EDGE, GAP, SLIDER_ROOM } from "../constants/stage-preview-tray-row.constants";
import type { RowPlace } from "../types/stage-preview-tray-row.types";

/**
 * Where a row goes: as wide as its preview's picture, under it, or above it where the window has no
 * room under it for the row and a slider. `below` is chosen once, as it opens, then kept.
 */
export function placeRow(picture: DOMRect, rowHeight: number, viewHeight: number, below: boolean | null): RowPlace {
  const under = below ?? picture.bottom + GAP + rowHeight + SLIDER_ROOM <= viewHeight - EDGE;
  const box = { below: under, left: picture.left, width: picture.width };
  return under ? { ...box, top: picture.bottom + GAP } : { ...box, bottom: viewHeight - picture.top + GAP };
}

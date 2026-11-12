import type { Sharer } from "../../../../types/room-view.types";
import type { BigStreams } from "../types/big-streams.types";

/**
 * Screen and camera together: the screen big, the camera in the facecam over it, unless the viewer
 * swapped them for that person. One alone: it plays big. Nobody: nothing.
 */
export function bigStreams(big: Sharer | null, swapped: boolean): BigStreams {
  if (!big) return { main: null, small: undefined };
  const both = Boolean(big.screen && big.camera);
  return {
    main: (both && swapped ? big.camera : big.screen) ?? big.camera ?? null,
    small: both ? (swapped ? big.screen : big.camera) : undefined,
  };
}

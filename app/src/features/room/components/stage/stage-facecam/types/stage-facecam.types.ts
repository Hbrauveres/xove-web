import type { RefObject } from "react";
import type { MediaTrack } from "@services/livekit-service";
import type { FacecamPlace } from "../../../../types/facecam.types";
import type { SmallViewFold } from "../../../../types/small-view.types";

export interface StageFacecamProps {
  video?: MediaTrack | undefined;
  /** The player it sits in: it moves within it. */
  player: RefObject<HTMLElement | null>;
  label: string;
  place: FacecamPlace;
  /** Its fold into the corner button, kept by the player. */
  fold: SmallViewFold;
  /** Puts this video in the big player, and the big one here. */
  onSwap: () => void;
  onMove: (place: FacecamPlace) => void;
}

/** How far the facecam can go and still be whole inside the player. */
export interface FacecamRoom {
  width: number;
  height: number;
  maxX: number;
  maxY: number;
}

/** A drag under way: which pointer, where it started, and the place it started from. */
export interface FacecamDrag {
  pointerId: number;
  x: number;
  y: number;
  from: FacecamPlace;
}

/** What moving the facecam needs: its box, its buttons (not handles), the player it moves in, and where it is. */
export interface FacecamMoveInput {
  box: RefObject<HTMLDivElement | null>;
  buttons: RefObject<HTMLDivElement | null>;
  player: RefObject<HTMLElement | null>;
  place: FacecamPlace;
  onMove: (place: FacecamPlace) => void;
}

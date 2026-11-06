import type { MediaTrack } from "@services/livekit-service";
import type { FacecamPlace } from "../../../types/facecam.types";

export interface StageFacecamProps {
  video?: MediaTrack | undefined;
  label: string;
  place: FacecamPlace;
  collapsed: boolean;
  /** Puts this video in the big player, and the big one here. */
  onSwap: () => void;
  onMove: (place: FacecamPlace) => void;
  onCollapse: (collapsed: boolean) => void;
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

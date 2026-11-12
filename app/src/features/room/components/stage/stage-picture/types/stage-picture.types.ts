import type { FacecamPlace } from "../../../../types/facecam.types";
import type { SmallViewFold } from "../../../../types/small-view.types";
import type { Playback } from "../../../../types/played-track.types";
import type { LiveFeed, Sharer } from "../../../../types/room-view.types";

export interface StagePictureProps {
  /** Who is on the stage. */
  big: Sharer;
  /** What plays big. */
  main: LiveFeed;
  /** What plays in the small view over it, with a screen and a camera both live. */
  small?: LiveFeed | undefined;
  /** How I hear their screen's sound, in this browser. */
  sound: Playback;
  /** Where the small view sits. */
  facecamPlace: FacecamPlace;
  onFacecamMove: (place: FacecamPlace) => void;
  /** The small view's fold, kept by the player. */
  fold: SmallViewFold;
  /** Puts the facecam's stream big, and the big one in the facecam. */
  onSwap: () => void;
  /** Hands out the big video element, for the stage light. */
  onVideo: (el: HTMLVideoElement | null) => void;
}

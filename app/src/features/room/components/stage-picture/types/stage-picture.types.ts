import type { FacecamPlace } from "../../../types/facecam.types";
import type { Playback } from "../../../types/played-track.types";
import type { LiveFeed, Sharer } from "../../../types/room-view.types";

export interface StagePictureProps {
  /** Who is on the stage. */
  big: Sharer;
  /** What plays big. */
  main: LiveFeed;
  /** What plays in the facecam over it, with a screen and a camera both live. */
  small?: LiveFeed | undefined;
  /** How I hear their screen's sound, in this browser. */
  sound: Playback;
  facecam: { place: FacecamPlace; collapsed: boolean };
  onFacecamMove: (place: FacecamPlace) => void;
  onFacecamCollapse: (collapsed: boolean) => void;
  /** Puts the facecam's stream big, and the big one in the facecam. */
  onSwap: () => void;
  /** Hands out the big video element, for the stage light. */
  onVideo: (el: HTMLVideoElement | null) => void;
}

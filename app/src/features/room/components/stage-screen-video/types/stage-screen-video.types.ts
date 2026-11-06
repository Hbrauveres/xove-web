import type { MediaTrack } from "@services/livekit-service";

export interface StageScreenVideoProps {
  video?: MediaTrack | undefined;
  /** The screen's sound, when it's someone else's and it plays. */
  sound?: MediaTrack | undefined;
  label: string;
  /** 0 to 1. */
  volume?: number | undefined;
  muted?: boolean | undefined;
  /** Hands out the video element, for the stage light to draw from; null when it goes. */
  onVideo?: ((el: HTMLVideoElement | null) => void) | undefined;
}

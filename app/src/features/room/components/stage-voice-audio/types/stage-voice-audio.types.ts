import type { MediaTrack } from "@services/livekit-service";

export interface StageVoiceAudioProps {
  track: MediaTrack;
  /** 0 to 1, in this browser only. */
  volume: number;
  muted: boolean;
}

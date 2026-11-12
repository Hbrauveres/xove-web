import type { MediaTrack } from "@services/livekit-service";

/** A sound to play: whose, its track, and this browser's volume and mute. */
interface PlayedSound {
  id: string;
  track: MediaTrack;
  volume: number;
  muted: boolean;
}

export interface StageSoundsProps {
  /** The voices I hear. */
  voices: PlayedSound[];
  /** The previews I turned on: their screens' sound. */
  previewSounds: PlayedSound[];
}

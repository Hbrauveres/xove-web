import { usePlayedTrack } from "../../../hooks/use-played-track.hook";
import type { StageVoiceAudioProps } from "./types/stage-voice-audio.types";

/** Plays someone's voice, or a preview's screen sound, at this browser's own volume; nothing to see. */
export function StageVoiceAudio({ track, volume, muted }: StageVoiceAudioProps) {
  const ref = usePlayedTrack<HTMLAudioElement>(track, { volume, muted });
  return <audio ref={ref} autoPlay />;
}

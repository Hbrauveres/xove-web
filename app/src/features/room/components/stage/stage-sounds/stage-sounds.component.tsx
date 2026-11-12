import { StageVoiceAudio } from "../stage-voice-audio";
import type { StageSoundsProps } from "./types/stage-sounds.types";

/** Every sound I hear in the room: the voices, and the previews' screens I turned on, each at its own volume. */
export function StageSounds({ voices, previewSounds }: StageSoundsProps) {
  return (
    <>
      {voices.map((v) => (
        <StageVoiceAudio key={v.id} track={v.track} volume={v.volume} muted={v.muted} />
      ))}
      {previewSounds.map((p) => (
        <StageVoiceAudio key={`sound-${p.id}`} track={p.track} volume={p.volume} muted={p.muted} />
      ))}
    </>
  );
}

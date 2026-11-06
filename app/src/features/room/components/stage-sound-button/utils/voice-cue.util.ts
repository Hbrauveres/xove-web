import type { SoundKind } from "../../../types/sound.types";
import type { VoiceCue } from "../types/stage-sound-button.types";

/** Their voice, heard: lit while they speak, faded while they're quiet. Anything else has no cue. */
export const voiceCue = (kind: SoundKind, off: boolean, talking: boolean): VoiceCue | undefined =>
  kind === "voice" && !off ? (talking ? "talking" : "silent") : undefined;

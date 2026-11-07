import type { HearSound, SoundKind } from "../../../types/sound.types";

export interface StageMoreSoundProps {
  kind: SoundKind;
  /** The sound, with whose voice it is, or nothing to show when there isn't one. */
  sound?: (HearSound & { name?: string | undefined }) | undefined;
}

import type { HearSound, SoundKind } from "../../../types/sound.types";

export interface StageMoreSoundProps {
  kind: SoundKind;
  sound: HearSound;
  /** Whose voice it is, for its words. */
  name?: string | undefined;
}

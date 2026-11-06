import type { Dispatch, RefCallback, SetStateAction } from "react";
import type { HearSound, SoundKind } from "../../../types/sound.types";

export interface StageViewerSoundProps {
  kind: SoundKind;
  sound: HearSound;
  /** Its slider is open. */
  open: boolean;
  /** A slider is open, this one or the other: its tooltip keeps quiet. */
  quiet: boolean;
  setOpen: Dispatch<SetStateAction<SoundKind | null>>;
  /** Its element, for the bar to know where the open slider is. */
  anchorRef: RefCallback<HTMLElement>;
  /** Whose voice. */
  name?: string | undefined;
  talking?: boolean | undefined;
}

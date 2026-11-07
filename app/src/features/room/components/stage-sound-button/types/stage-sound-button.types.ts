import type { PointerEventHandler, Ref } from "react";
import type { SoundKind } from "../../../types/sound.types";

/** Their voice's cue: lit while they speak, faded while they're quiet. */
export type VoiceCue = "talking" | "silent";

export interface StageSoundButtonProps {
  kind: SoundKind;
  muted: boolean;
  /** Its volume, 0 to 1: at 0 it shows as off, like muted. */
  volume: number;
  /** Why it can't be used (no sound shared, their mic off): greyed, and a click says why. */
  unavailable?: string | undefined;
  /** Their voice while they speak: the speaking cue. */
  talking?: boolean | undefined;
  /** Its spoken name: what a click does ("Mute Ana's voice"), or why it can't be used. */
  label: string;
  /** What it is, in its tooltip ("Ana's voice"). */
  tip: string;
  /** A slider is open: its tooltip keeps quiet. */
  quiet?: boolean | undefined;
  /** Its slider is open: a soft ring, so a change of sound is seen. */
  active?: boolean | undefined;
  onToggle: () => void;
  /** Its focus came from the keyboard: the slider opens, as on a rest. */
  onKeyboardFocus?: (() => void) | undefined;
  onPointerEnter?: PointerEventHandler<HTMLButtonElement> | undefined;
  onPointerLeave?: PointerEventHandler<HTMLButtonElement> | undefined;
  ref?: Ref<HTMLButtonElement> | undefined;
}

import type { Sound, SoundKind } from "../../../types/sound.types";

/** Switching sounds: the old slider shrinks away while the new one grows in. */
type SliderPhase = "leaving" | "entering";

export interface StageSoundSliderProps {
  kind: SoundKind;
  sound: Sound;
  /** Its spoken name; the one leaving has none, and can't be changed. */
  label?: string | undefined;
  phase?: SliderPhase | undefined;
  /** A new volume, 0 to 1. */
  onVolume?: ((volume: number) => void) | undefined;
  /** Its leaving or entering has ended. */
  onDone?: (() => void) | undefined;
}

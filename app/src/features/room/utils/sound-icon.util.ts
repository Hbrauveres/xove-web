import type { IconName } from "@shared/types/icon.types";
import type { SoundKind } from "../types/sound.types";

/** A sound's icon: crossed out while it's muted or can't be heard. */
export const soundIcon = (kind: SoundKind, off: boolean): IconName =>
  kind === "sound" ? (off ? "volume-off" : "sound") : off ? "voice-off" : "voice";

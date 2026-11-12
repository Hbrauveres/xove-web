import type { Hearing, SoundKind } from "../../../../types/sound.types";

/** Which sound the drawer sets, and the one shrinking away while it switches. */
interface DrawerSounds {
  shown: SoundKind | null;
  leaving: SoundKind | null;
  entering: boolean;
  left: () => void;
  entered: () => void;
}

export interface StageSoundDrawerProps {
  /** A slider is open: the drawer unrolls. */
  open: boolean;
  hearing: Hearing;
  drawer: DrawerSounds;
  /** The shown slider's spoken name. */
  label: string;
  onVolume: (kind: SoundKind, volume: number) => void;
}

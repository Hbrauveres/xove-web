import type { Sharer } from "../../../types/room-view.types";
import type { Hearing } from "../../../types/sound.types";

export interface StageAlsoLiveProps {
  /** Everyone sharing except the person on the stage, longest first. */
  others: Sharer[];
  /** Live streams, everyone's. */
  liveCount: number;
  /** How many streams can be live at once: one little screen each. */
  places: number;
  /** Places left. */
  free: number;
  onPick: (personId: string) => void;
  /** What I hear from each person, and muting it from their preview. */
  hearOf: (personId: string) => Hearing;
  onHear: (personId: string, hearing: Hearing) => void;
  /** Whether a person's preview shows their camera instead of their screen, and swapping it. */
  swappedOf?: ((personId: string) => boolean) | undefined;
  onSwap?: ((personId: string) => void) | undefined;
}

import type { Sharer } from "../../../types/room-view.types";
import type { Hearing } from "../../../types/sound.types";

export interface StageHearTogglesProps {
  sharer: Sharer;
  hearing: Hearing;
  onChange: (h: Hearing) => void;
  /** Their screen and camera swap, when they share both. */
  swap?: { on: boolean; onSwap: () => void } | undefined;
  /** Told while a slider is open, so what holds the row keeps it open. */
  onActive?: ((active: boolean) => void) | undefined;
}

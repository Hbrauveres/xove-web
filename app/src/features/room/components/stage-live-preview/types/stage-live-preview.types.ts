import type { PreviewTray } from "../../../types/preview-tray.types";
import type { Sharer } from "../../../types/room-view.types";

export interface StageLivePreviewProps {
  sharer: Sharer;
  /** Their camera in front instead of their screen. */
  swapped: boolean;
  /** Their swap is playing: the two pictures trade places. */
  swapping: boolean;
  /** Their voice heard while they speak, the row closed: the picture's ring lights. */
  talking: boolean;
  tray: PreviewTray;
  onPick: (personId: string) => void;
}

import type { StreamKind } from "@services/xove-api-service";
import type { StreamControls } from "../../../../../components/stage/PlayerButtons";
import type { RoomHearing } from "../../../types/room-hearing.types";
import type { Sharer } from "../../../types/room-view.types";

export interface StageControlsProps {
  /** Who is on the stage, or nobody. */
  big: Sharer | null;
  /** My screen, camera and voice. */
  controls: StreamControls;
  /** What I hear from each person, and how to change it. */
  hearing: RoomHearing;
  /** Starts my screen or camera, and takes me to it. */
  onStart: (kind: StreamKind) => void;
  /** Opens or closes the settings. */
  onSettings: () => void;
  /** One of my buttons' menus opened or closed: it holds the controls up. */
  onMenuChange: (open: boolean) => void;
}

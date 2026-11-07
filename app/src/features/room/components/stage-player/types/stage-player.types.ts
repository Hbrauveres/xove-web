import type { ReactNode } from "react";
import type { AmbilightPrefs } from "@services/preferences-service";
import type { StreamControls } from "@features/room/types/stream-controls.types";
import type { RoomHearing } from "../../../types/room-hearing.types";
import type { Sharer } from "../../../types/room-view.types";
import type { StagePick } from "../../../types/stage.types";

export interface StagePlayerProps {
  sharers: Sharer[];
  controls: StreamControls;
  /** Who is on the stage, kept by the room. */
  stage: StagePick;
  hearing: RoomHearing;
  ambilight: AmbilightPrefs;
  /** The picture's shape, width ÷ height. */
  shape: number;
  /** The big video, and where it's handed out to (the stage takes its shape from it). */
  video: HTMLVideoElement | null;
  onVideo: (el: HTMLVideoElement | null) => void;
  /** The settings panel, inside the player so it comes along in fullscreen. */
  settingsPanel?: ReactNode;
}

import type { ReactNode } from "react";
import type { AmbilightPrefs } from "@services/preferences-service";
import type { StreamControls } from "../../../../../components/stage/PlayerButtons";
import type { Friend, Sharer } from "../../../types/room-view.types";
import type { StagePick } from "../../../types/stage.types";

export interface StageProps {
  /** Everyone with a live stream, the longest sharing first. */
  sharers: Sharer[];
  /** My screen and camera: the round buttons over the bottom of the stage. */
  controls: StreamControls;
  /** Who is on the stage, kept by the room. */
  stage: StagePick;
  /** The light round the stage. */
  ambilight: AmbilightPrefs;
  /** Who has the person on the stage on theirs, me included, never that person. */
  watchers?: Friend[] | undefined;
  /** The others in the room, for the empty stage's row. */
  others?: Friend[] | undefined;
  /** The settings panel, over the cog: inside the player, so it comes along in fullscreen. */
  settingsPanel?: ReactNode;
}

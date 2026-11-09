import type { RoomHearing } from "../../../types/room-hearing.types";
import type { Friend, Sharer } from "../../../types/room-view.types";
import type { StagePick } from "../../../types/stage.types";

export interface StageInfoProps {
  /** Everyone live. */
  sharers: Sharer[];
  /** Who is on the stage, kept by the room. */
  stage: StagePick;
  hearing: RoomHearing;
  /** How many streams can be live at once. */
  places: number;
  /** Stream places left. */
  free: number;
  watchers?: Friend[] | undefined;
  /** My voice is being sent: my face under the stage turns green. */
  meTalking?: boolean | undefined;
  /** The others in the room. */
  here?: Friend[] | undefined;
}

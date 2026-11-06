import type { RoomHearing } from "../../../types/room-hearing.types";
import type { Friend, Sharer } from "../../../types/room-view.types";
import type { StagePick } from "../../../types/stage.types";

export interface StageInfoProps {
  /** Everyone live. */
  sharers: Sharer[];
  /** Who is on the stage, kept by the room. */
  stage: StagePick;
  hearing: RoomHearing;
  /** Stream places left. */
  free: number;
  watchers?: Friend[] | undefined;
  /** The others in the room. */
  here?: Friend[] | undefined;
}

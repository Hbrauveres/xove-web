import type { Friend, Sharer } from "../../../types/room-view.types";

export interface StageNowWatchingProps {
  sharer: Sharer | null;
  /** Everyone with this stream on their stage, me included, never the sharer. */
  watchers?: Friend[] | undefined;
  /** The face on the stage is mine and my voice is being sent: its ring turns green. */
  talking?: boolean | undefined;
  /** The others in the room, for an empty stage. */
  others?: Friend[] | undefined;
}

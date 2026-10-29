import { useMemo } from "react";
import type { RoomModel } from "../state/room.types";
import type { VideoRoomState } from "@core/livekit/livekit.types";
import { activityOf } from "../state/room.selectors";
import type { ActivityEvent } from "../types/room-view.types";

/** What happened in the room, in order: the video room's joins and leaves with the room's own events. */
export function useActivityFeed(events: RoomModel["activity"], presence: VideoRoomState["presence"]): ActivityEvent[] {
  const joins = useMemo(
    () => presence.map((p): ActivityEvent => ({ id: `lk${p.id}`, at: p.at, kind: p.kind, actorId: p.identity })),
    [presence],
  );
  return useMemo(() => activityOf({ activity: events }, joins), [events, joins]);
}

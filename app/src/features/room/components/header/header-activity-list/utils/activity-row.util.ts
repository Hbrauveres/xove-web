import type { StreamKind } from "@services/xove-api-service";
import type { ActivityEvent } from "../../../../types/room-view.types";
import { describeEvent } from "../../../../utils/activity-text.util";
import type { ActivityRow, ActivityRowContext } from "../types/header-activity-list.types";

/** What an event's row shows: its words, and whether it's a live stream to watch. */
export function activityRow(e: ActivityEvent, { nameOf, meId, isLive, watching }: ActivityRowContext): ActivityRow {
  const kind: StreamKind = e.stream ?? "screen";
  const watchable = e.kind === "started" && isLive(e.actorId, kind);
  return {
    text: describeEvent(e, nameOf, meId),
    kind,
    isStream: e.kind === "started" || e.kind === "stopped",
    watchable,
    watched: watchable && watching?.personId === e.actorId && watching.kind === kind,
  };
}

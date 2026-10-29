import type { StreamKind } from "@services/xove-api-service/types/api.types";
import type { VideoRoomState } from "@services/livekit-service/types/livekit.types";
import type { LiveFeed } from "@features/room/types/room-view.types";
import type { RoomStream } from "../types/room.types";

export function feedOf(
  streams: RoomStream[],
  kind: StreamKind,
  video: VideoRoomState,
  isMe: boolean,
): LiveFeed | undefined {
  const s = streams.find((x) => x.kind === kind);
  if (!s) return undefined;
  const remote = isMe ? undefined : video.remote[s.personId]?.[kind];
  const local = isMe ? video.local[kind] : undefined;
  return { kind, startedAt: s.since, settings: s.settings, ...(remote ? { remote } : {}), ...(local ? { local } : {}) };
}

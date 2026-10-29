import type { VideoRoomState } from "@core/livekit/livekit.types";
import type { RoomModel, SeatState } from "../state/room.types";

/**
 * Whether the room can show: with a seat (the API hands out the video access to seated people
 * only), and once I'm named, so everyone has their own colour from the start. Without the video
 * access at all it still opens, to say why. Until then, the waiting screen shows `waiting`.
 */
export function roomEntry(
  model: Pick<RoomModel, "seat" | "me">,
  video: Pick<VideoRoomState, "connection" | "error">,
): { ready: boolean; waiting: SeatState } {
  const seated = model.seat?.status === "in";
  const noVideo = video.connection === "disconnected" && video.error !== null;
  const ready = seated && (model.me !== null || noVideo);
  return { ready, waiting: seated ? null : model.seat };
}

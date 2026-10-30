import type { IconName } from "@shared/types/icon.types";
import type { ActivityEvent } from "../types/room-view.types";

/** The small icon in front of an event: a screen or a camera for streams, a door for people. */
export function activityIconOf(event: ActivityEvent): IconName {
  if (event.kind === "started" || event.kind === "stopped")
    return event.stream === "camera" ? "stream-camera" : "stream-screen";
  if (event.kind === "left") return "left";
  if (event.kind === "reconnected") return "reconnected";
  return "joined";
}

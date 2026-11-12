import type { ActivityEvent } from "../../../../types/room-view.types";

/** How many events came after the last one seen: all of them when none was seen, or that one is gone. */
export function unseenCount(events: ActivityEvent[], seenId: string | null): number {
  const seenAt = events.findIndex((e) => e.id === seenId);
  return seenAt === -1 ? events.length : events.length - 1 - seenAt;
}

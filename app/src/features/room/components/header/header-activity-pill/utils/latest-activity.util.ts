import { shortAgo } from "@shared/utils/time-ago.util";
import type { LatestActivity } from "../../../../types/activity.types";
import type { ActivityEvent, Friend } from "../../../../types/room-view.types";
import { describeEvent } from "../../../../utils/activity-text.util";
import { personName } from "../../../../utils/person-name.util";

/** The newest event, in words, with how long ago and who did it; null before anything happened. */
export function latestActivity(
  events: ActivityEvent[],
  people: Friend[],
  meId: string,
  now: number,
): LatestActivity | null {
  const event = events.at(-1);
  if (!event) return null;
  const nameOf = (id: string) => personName(people, id);
  return {
    id: event.id,
    text: describeEvent(event, nameOf, meId),
    ago: shortAgo(event.at, now),
    actor: people.find((p) => p.id === event.actorId),
  };
}

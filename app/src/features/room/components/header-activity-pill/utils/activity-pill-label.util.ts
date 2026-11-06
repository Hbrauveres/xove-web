import { RECONNECTING } from "../constants/activity-pill.constants";

/** The pill's spoken name: what happened, how long ago and how many are new; or that the connection dropped. */
export function activityPillLabel(
  reconnecting: boolean,
  latest: { text: string; ago: string } | null,
  fresh: number,
): string {
  if (reconnecting) return RECONNECTING;
  if (!latest) return "Activity: nothing new yet";
  const when = latest.ago === "now" ? "just now" : `${latest.ago} ago`;
  return `Activity: ${latest.text}, ${when}${fresh ? `, ${fresh} new` : ""}`;
}

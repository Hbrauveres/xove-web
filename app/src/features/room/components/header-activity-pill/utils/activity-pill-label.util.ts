import { RECONNECTING } from "../constants/activity-pill.constants";

/** The pill's spoken name: what happened, how long ago and how many are new; or that the connection dropped. */
export function activityPillLabel(
  reconnecting: boolean,
  latest: { text: string; ago: string } | null,
  fresh: number,
): string {
  if (reconnecting) return RECONNECTING;
  if (!latest) return "Activity: nothing new yet";
  // The words the pill shows, in its order, so what's read out is what's seen.
  return `Activity: ${latest.text}, ${latest.ago}${fresh ? `, ${fresh} new` : ""}`;
}

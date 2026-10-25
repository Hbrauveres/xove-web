import { MINUTES_PER_HOUR, MS_PER_SECOND, SECONDS_PER_MINUTE } from "../constants/time.constants";

/** Under this many seconds, it happened "just now". */
const JUST_NOW_SECONDS = 45;

/** "just now", "4 min ago", "1 h ago" for the activity feed. */
export function timeAgo(at: number, now = Date.now()): string {
  const sec = Math.floor((now - at) / MS_PER_SECOND);
  if (sec < JUST_NOW_SECONDS) return "just now";
  const min = Math.round(sec / SECONDS_PER_MINUTE);
  if (min < MINUTES_PER_HOUR) return `${min} min ago`;
  return `${Math.round(min / MINUTES_PER_HOUR)} h ago`;
}

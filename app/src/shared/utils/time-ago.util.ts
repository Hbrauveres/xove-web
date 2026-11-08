import { JUST_NOW_SECONDS, MINUTES_PER_HOUR, MS_PER_SECOND, SECONDS_PER_MINUTE } from "../constants/time.constants";

/**
 * How long ago, short: "now", "4 min", "1 h". In whole units passed, rounded down (90 minutes is
 * 1 h); from 45 seconds, never less than "1 min".
 */
export function shortAgo(at: number, now = Date.now()): string {
  const sec = Math.floor((now - at) / MS_PER_SECOND);
  if (sec < JUST_NOW_SECONDS) return "now";
  const min = Math.max(1, Math.floor(sec / SECONDS_PER_MINUTE));
  if (min < MINUTES_PER_HOUR) return `${min} min`;
  return `${Math.floor(min / MINUTES_PER_HOUR)} h`;
}

/** How long ago, as a phrase: "just now", "4 min ago", "1 h ago". */
export function timeAgo(at: number, now = Date.now()): string {
  const ago = shortAgo(at, now);
  return ago === "now" ? "just now" : `${ago} ago`;
}

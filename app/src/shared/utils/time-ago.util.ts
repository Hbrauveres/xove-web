/** "just now", "4 min ago", "1 h ago" for the activity feed. */
export function timeAgo(at: number, now = Date.now()): string {
  const sec = Math.floor((now - at) / 1000);
  if (sec < 45) return "just now";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} min ago`;
  return `${Math.round(min / 60)} h ago`;
}

/**
 * Which stream on the stage has shown its video (`key`, its sharer and kind), or null: one that has
 * is stopping when its video goes, not loading.
 */
export function seenVideo(seen: string | null, key: string, hasVideo: boolean): string | null {
  if (hasVideo) return key;
  return seen === key ? key : null;
}

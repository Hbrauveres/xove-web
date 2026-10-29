import type { StreamKind } from "@services/xove-api-service";
import type { Pick } from "../types/stage.types";
import type { Sharer } from "../types/room-view.types";

/**
 * Who is shown big for one viewer: the person they picked, while that person
 * is still sharing; otherwise the person sharing the longest. So the first sharer is big
 * by default, and when the big one stops, the longest sharing takes the place.
 *
 * @param sharing everyone with a live stream, the longest sharing first
 * @param picked  the viewer's last click on a thumbnail, if any
 */
export function stagePick(sharing: readonly string[], picked: string | null): string | null {
  if (picked !== null && sharing.includes(picked)) return picked;
  return sharing[0] ?? null;
}

/** Which of the big person's streams is big: the only one, or with both, the screen unless swapped. */
export function mainKindOf(big: Sharer | null, swapped: boolean): StreamKind | null {
  if (!big) return null;
  if (big.screen && big.camera) return swapped ? "camera" : "screen";
  return big.screen ? "screen" : "camera";
}

/** The big video plays (not still loading): only then does it count as watched. */
export function isPlaying(big: Sharer | null, kind: StreamKind | null): boolean {
  const feed = big && kind ? big[kind] : undefined;
  return Boolean(big && feed && (big.isMe ? feed.local : feed.remote));
}

/** When someone's live streams started: what a pick remembers of them. */
export function streamsOf(sharer: Sharer | undefined): number[] {
  return [sharer?.screen?.startedAt, sharer?.camera?.startedAt].filter((t): t is number => t !== undefined);
}

/** A pick holds while one of the streams live when it was made still is. */
export function holds(pick: Pick, sharers: readonly Sharer[]): boolean {
  const now = streamsOf(sharers.find((s) => s.person.id === pick.personId));
  return now.some((t) => pick.streams.includes(t));
}

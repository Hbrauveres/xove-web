import type { Sharer } from "../../../types/room-view.types";

/**
 * The previews' order in the strip, which sits against the places: the newest sharing first, so a
 * stream that starts enters at the far end and never moves a preview that's already there.
 */
export function stripOrder(others: Sharer[]): Sharer[] {
  return [...others].sort((a, b) => b.since - a.since);
}

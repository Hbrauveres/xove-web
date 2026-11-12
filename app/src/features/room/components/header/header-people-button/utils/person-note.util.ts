import { SHARING_NOTE } from "../constants/people-button.constants";
import type { SharingOf, WatchingOf } from "../types/header-people-button.types";

/** The line under a person's name: what they share, or whose live stream they watch. */
export function personNote(
  id: string,
  sharing: SharingOf,
  watchingOf: WatchingOf,
  nameOf: (id: string) => string,
): string {
  const shares = sharing[id];
  const note = shares && SHARING_NOTE[`${shares.screen}-${shares.camera}`];
  if (note) return note;
  // Only someone live is watched: after they stop, the watcher is just in the room.
  const watched = watchingOf[id]?.sharerId;
  const live = watched !== undefined && Object.values(sharing[watched] ?? {}).some(Boolean);
  return live ? `Watching ${nameOf(watched)}` : "In the room";
}

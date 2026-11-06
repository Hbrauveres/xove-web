import type { SharingOf, WatchingOf } from "../types/header-people-button.types";

/** The line under a person's name: what they share, or whose stream they watch. */
export function personNote(
  id: string,
  sharing: SharingOf,
  watchingOf: WatchingOf,
  nameOf: (id: string) => string,
): string {
  const shares = sharing[id];
  if (shares?.screen && shares.camera) return "Sharing screen and camera";
  if (shares?.screen) return "Sharing their screen";
  if (shares?.camera) return "Sharing their camera";
  const watch = watchingOf[id];
  return watch ? `Watching ${nameOf(watch.sharerId)}` : "In the room";
}

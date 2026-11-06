import type { Friend } from "../types/room-view.types";

/** A person's name, by their id; "Someone" (or the given word) for someone no longer known. */
export function personName(people: Friend[], id: string, unknown = "Someone"): string {
  return people.find((p) => p.id === id)?.name ?? unknown;
}

import type { Friend } from "../../../types/room-view.types";
import type { SharingOf } from "../types/header-people-button.types";

/** The people sharing first (in the order they started), then me, then everyone else. */
export function peopleOrder(people: Friend[], meId: string, sharing: SharingOf): Friend[] {
  const sharers = Object.keys(sharing)
    .map((id) => people.find((p) => p.id === id))
    .filter((p): p is Friend => p !== undefined);
  const rest = people.filter((p) => !sharing[p.id]);
  return [...sharers, ...rest.filter((p) => p.id === meId), ...rest.filter((p) => p.id !== meId)];
}

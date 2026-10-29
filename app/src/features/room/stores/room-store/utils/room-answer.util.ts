import type { StreamsState } from "@services/xove-api-service";
import type { PersonId, Watch } from "../../../types/room.types";
import { personIdOf } from "../../../utils/person-id.util";
import { keepSame } from "./keep-same.util";

/** The room with these names added; the same record when every name is already there. */
export function withNames(names: Record<PersonId, string>, added: [PersonId, string][]) {
  const fresh = added.filter(([id, name]) => names[id] !== name);
  return fresh.length ? { ...names, ...Object.fromEntries(fresh) } : names;
}

export function watchesOf(
  before: Record<PersonId, Watch> | null,
  answer: StreamsState,
): Record<PersonId, Watch> | null {
  if (!answer.watching) return null;
  const now: Record<PersonId, Watch> = Object.fromEntries(
    answer.watching.map((w) => [personIdOf(w.userId), { sharerId: personIdOf(w.sharerId), kind: w.kind }]),
  );
  return keepSame(before, now);
}

/** Whose user id is mine, when the API lists something of mine. */
export function myIdIn(answer: StreamsState): PersonId | null {
  const mine = [...answer.streams, ...(answer.here ?? []), ...(answer.watching ?? [])].find((x) => x.mine);
  return mine ? personIdOf(mine.userId) : null;
}

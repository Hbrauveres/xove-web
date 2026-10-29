import type { PersonId } from "../../../types/room.types";

export const samePeople = (a: PersonId[], b: PersonId[]) => a.length === b.length && a.every((id, i) => id === b[i]);

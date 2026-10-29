import type { PersonId } from "../state/room.types";

/** Who I picked for my stage, and when their streams then live had started. */
export type Pick = { personId: PersonId; streams: number[] };

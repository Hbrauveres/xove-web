import type { PersonId } from "../types/room.types";

/** Someone's id in the room, from their user id at the API. */
export const personIdOf = (userId: number): PersonId => `user-${userId}`;

/** Someone's user id at the API, from their id in the room. */
export const userIdOf = (personId: PersonId) => Number(personId.slice("user-".length));

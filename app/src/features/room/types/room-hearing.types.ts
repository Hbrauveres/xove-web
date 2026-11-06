import type { useHearing } from "../hooks/use-hearing.hook";

/** What the room's hearing hook gives: what I hear from each person, and how to change it. */
export type RoomHearing = ReturnType<typeof useHearing>;

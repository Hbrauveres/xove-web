import type { RoomSeatsState, StreamKind } from "@services/xove-api-service";
import type { Friend } from "../../../../types/room-view.types";

/** What each person shares, by their id. */
export type SharingOf = Record<string, { screen: boolean; camera: boolean }>;
/** Whose stream each person has on their stage, by their id. */
export type WatchingOf = Record<string, { sharerId: string; kind: StreamKind }>;

export interface HeaderPeopleButtonProps {
  /** Everyone in the room, me first. */
  people: Friend[];
  meId: string;
  sharing: SharingOf;
  watchingOf: WatchingOf;
  /** My voice is being sent: my face in the list turns green (only mine, only while live). */
  meTalking?: boolean | undefined;
  /** The room's seats, or null when the API doesn't say. */
  seats: RoomSeatsState | null;
}

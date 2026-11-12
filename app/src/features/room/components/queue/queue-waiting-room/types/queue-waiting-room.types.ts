import type { RoomSeat } from "../../../../types/room.types";

export interface QueueWaitingRoomProps {
  seat: RoomSeat;
  onSignOut: () => void;
}

/** What the waiting room's card says: a title (none while looking), its line, and whether I can join again. */
export type QueueMessage = { title: string | null; text: string; canRejoin: boolean };

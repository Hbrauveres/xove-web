import { useMemo } from "react";
import type { RoomModel, RoomSeat } from "../../../types/room.types";
import type { RoomStore } from "../room.store";

/** My seat in the room, with what I can do about it: take the seat offered, give it up, enter again. */
export function useRoomSeat(store: RoomStore, model: Pick<RoomModel, "seat" | "seatError">): RoomSeat {
  return useMemo<RoomSeat>(
    () => ({
      status: model.seat,
      error: model.seatError,
      accept: () => void store.accept(),
      cancel: () => void store.cancel(),
      rejoin: store.rejoin,
    }),
    [model.seat, model.seatError, store],
  );
}

import type { SeatState } from "../types/room.types";

export const waitingFor = (seat: SeatState) => seat === null || seat.status === "waiting" || seat.status === "offered";

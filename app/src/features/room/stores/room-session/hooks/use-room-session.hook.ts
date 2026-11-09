import { createContext, useContext } from "react";
import type { RoomSession } from "../types/room-session.types";

/** Filled by `RoomSessionProvider`; tests and stories give it a session of their own. */
export const RoomSessionContext = createContext<RoomSession | null>(null);

/** The room as its areas read it. Only inside `RoomSessionProvider`. */
export function useRoomSession(): RoomSession {
  const session = useContext(RoomSessionContext);
  if (!session) throw new Error("useRoomSession must be used inside <RoomSessionProvider>");
  return session;
}

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { RoomStore } from "../room.store";

/**
 * The room's store for as long as the room's page is open: it asks for my seat, joins the
 * video room once I have one, and polls. The page reads the room and the video room here.
 */
export function useRoomStore(myName: string, pollMs?: number) {
  const [store] = useState(() => new RoomStore(myName, pollMs));
  useEffect(() => {
    store.open();
    return store.close;
  }, [store]);
  const { model, video } = useSyncExternalStore(store.subscribe, store.getState);
  return useMemo(() => ({ store, model, video }), [store, model, video]);
}

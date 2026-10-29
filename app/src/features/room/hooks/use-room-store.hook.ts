import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { RoomStore } from "../stores/room-store/room.store";
import type { RoomSeat } from "../types/room.types";
import { useDeviceList } from "./use-device-list.hook";
import { useRememberedCamera } from "./use-remembered-camera.hook";
import { useSoundUnlock } from "./use-sound-unlock.hook";

/**
 * The room's store for as long as the room's page is open: it asks for my seat, joins the
 * video room once I have one, and polls; the page reads it here. Also unlocks the page's sound,
 * lists the devices and remembers the camera picked.
 */
export function useRoomStore(myName: string, pollMs?: number) {
  const [store] = useState(() => new RoomStore(myName, pollMs));
  useEffect(() => {
    store.open();
    return store.close;
  }, [store]);
  const { model, video } = useSyncExternalStore(store.subscribe, store.getState);

  useSoundUnlock(store.video.unlockAudio);
  // The names show once a camera or mic is allowed: list them again then.
  const devices = useDeviceList(`${video.publishing.camera}-${video.voice}`);
  const camera = useRememberedCamera(store.video);

  const seat = useMemo<RoomSeat>(
    () => ({
      status: model.seat,
      error: model.seatError,
      accept: () => void store.accept(),
      cancel: () => void store.cancel(),
      rejoin: store.rejoin,
    }),
    [model.seat, model.seatError, store],
  );

  return useMemo(() => ({ store, model, video, devices, camera, seat }), [store, model, video, devices, camera, seat]);
}

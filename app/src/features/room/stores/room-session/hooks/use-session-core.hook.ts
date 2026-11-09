import { useMemo } from "react";
import type { DeviceList } from "@services/media-devices-service";
import { useActivityFeed } from "./use-activity-feed.hook";
import { useMyVoice } from "./use-my-voice.hook";
import { useMySending } from "./use-my-sending.hook";
import { useRoomView } from "./use-room-view.hook";
import { useStreamSync } from "./use-stream-sync.hook";
import type { RememberedCamera } from "../types/remembered-camera.types";
import type { RoomStoreValue } from "../types/room-store.types";

/** The room as its hooks give it, in one place: my streams kept in sync, my voice, the activity. */
export function useSessionCore(room: RoomStoreValue, devices: DeviceList, camera: RememberedCamera) {
  const { store, model, video } = room;
  const view = useRoomView(model, video, store.myName);
  const mySending = useMySending(room, camera, view.myLive);
  useStreamSync({
    store,
    model,
    live: view.myLive,
    publishing: video.publishing,
    connection: video.connection,
    connectionOf: store.video.connectionOf,
    stopSending: store.video.stop,
    queue: mySending.queue,
  });
  const voice = useMyVoice({
    voice: video.voice,
    sending: video.publishing.screen || video.publishing.camera,
    startVoice: store.video.startVoice,
    stopVoice: store.video.stopVoice,
    applyVoice: store.video.applyVoice,
    setVoiceLine: store.video.setVoiceLine,
  });
  const activity = useActivityFeed(model.activity, video.presence);
  const cameraId = video.cameraId || camera.savedCamera;
  return useMemo(() => {
    const { queue: _queue, ...sending } = mySending;
    return {
      ...view,
      ...sending,
      ...voice,
      activity,
      mine: view.myLive,
      error: model.streamsError ?? video.error ?? null,
      places: model.places,
      free: model.free,
      seats: model.seats,
      cameras: devices.cameras,
      mics: devices.mics,
      cameraId,
      video,
    };
  }, [view, mySending, voice, activity, model, video, devices, cameraId]);
}

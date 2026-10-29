import { useMemo } from "react";
import type { StreamKind } from "@core/api/api.types";
import { useCameraPreview } from "./use-camera-preview.hook";
import { useCameraSwitch } from "./use-camera-switch.hook";
import { useChangeWindow } from "./use-change-window.hook";
import { useMyStreams } from "./use-my-streams.hook";
import type { RoomStoreValue } from "./use-room-store.hook";
import { useStreamSettings } from "./use-stream-settings.hook";

/**
 * Everything about what I send, put together: my streams and their settings, the camera's preview
 * and switch, and changing the window. Its `queue` is what keeping in step with the API needs.
 */
export function useMySending(room: RoomStoreValue, myLive: Record<StreamKind, boolean>) {
  const { store, model, video } = room;
  const settings = useStreamSettings({
    live: myLive,
    publishing: video.publishing,
    applySettings: store.video.applySettings,
    changeAtApi: store.changeStreamSettings,
  });
  const preview = useCameraPreview({
    capture: room.camera.capture,
    discard: store.video.discardCapture,
    camera: settings.prefs.camera,
    cameraSent: video.publishing.camera,
  });
  const pickCamera = useCameraSwitch({
    pickOnVideo: room.camera.pickCamera,
    camera: settings.prefs.camera,
    restartPreview: preview.restart,
  });
  const streams = useMyStreams({
    store,
    video: store.video,
    capture: room.camera.capture,
    prefs: settings.prefs,
    queue: settings.queue,
    takePreview: preview.takePreview,
    mine: model.mine,
  });
  const windowChange = useChangeWindow({
    changeScreen: store.video.changeScreen,
    screen: settings.prefs.screen,
    onSound: streams.onScreenSound,
  });

  return useMemo(
    () => ({
      prefs: settings.prefs,
      setPrefs: settings.setPrefs,
      start: streams.start,
      stop: streams.stop,
      changeScreen: windowChange.changeScreen,
      pickCamera,
      cameraPreview: preview.cameraPreview,
      previewCamera: preview.previewCamera,
      queue: settings.queue,
      // Only while my screen is actually going out.
      noSound: streams.noSound && myLive.screen && video.publishing.screen,
      busy: model.streamsBusy || streams.busy || windowChange.changing,
    }),
    [settings, streams, windowChange, pickCamera, preview, myLive.screen, video.publishing.screen, model.streamsBusy],
  );
}

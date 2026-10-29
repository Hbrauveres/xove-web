import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { ApiError, api } from "@core/api/api-client.service";
import { LiveKitAdapter } from "@core/livekit/livekit.adapter";
import { CANT_CONNECT } from "@core/livekit/livekit.constants";
import type { ActivityEvent } from "../../../types";
import { useDeviceList } from "./use-device-list.hook";
import { useRememberedCamera } from "./use-remembered-camera.hook";
import { useSoundUnlock } from "./use-sound-unlock.hook";

/**
 * The room's video server, for as long as the room is open: gets the access from the API,
 * connects, and hands the room what the adapter knows, changing only what changed. Also unlocks
 * the page's sound on the first click or key, lists the devices, and remembers the camera picked.
 */
export function useVideoRoom() {
  const [adapter] = useState(() => new LiveKitAdapter());
  const state = useSyncExternalStore(adapter.subscribe, adapter.getState);

  useEffect(() => {
    let cancelled = false;
    api.liveKitToken().then(
      (access) => (cancelled ? undefined : adapter.connect(access.url, access.token)),
      (e: unknown) => {
        if (!cancelled) adapter.fail(e instanceof ApiError ? e.message : CANT_CONNECT);
      },
    );
    return () => {
      cancelled = true;
      adapter.disconnect();
    };
  }, [adapter]);

  useSoundUnlock(adapter.unlockAudio);
  // The names show once a camera or mic is allowed: list them again then.
  const devices = useDeviceList(`${state.publishing.camera}-${state.voice}`);

  const { savedCamera, capture, pickCamera } = useRememberedCamera(adapter);

  const presence = useMemo(
    () =>
      state.presence.map((p): ActivityEvent => ({
        id: `lk-${p.identity}-${p.at}-${p.kind}`,
        at: p.at,
        kind: p.kind,
        actorId: p.identity,
      })),
    [state.presence],
  );

  return useMemo(
    () => ({
      ...state,
      presence,
      cameras: devices.cameras,
      mics: devices.mics,
      // The camera being sent is the one in use, whatever was saved.
      cameraId: state.cameraId || savedCamera,
      capture,
      pickCamera,
      publishCapture: adapter.publishCapture,
      discardCapture: adapter.discardCapture,
      applySettings: adapter.applySettings,
      stop: adapter.stop,
      changeScreen: adapter.changeScreen,
      connectionOf: adapter.connectionOf,
      participantSid: adapter.participantSid,
      startVoice: adapter.startVoice,
      stopVoice: adapter.stopVoice,
      applyVoice: adapter.applyVoice,
      setVoiceLine: adapter.setVoiceLine,
    }),
    [state, presence, devices, savedCamera, capture, pickCamera, adapter],
  );
}

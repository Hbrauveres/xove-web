import { useCallback, useState } from "react";
import type { StreamKind, StreamMode, StreamSettings } from "@core/api/api.types";
import type { LiveKitAdapter } from "@core/livekit/livekit.adapter";
import type { Capture } from "@core/livekit/livekit.types";
import { loadCameraDevice, saveCameraDevice } from "@core/preferences/preferences.service";

/**
 * The camera this browser remembers: asked for when the camera starts, switched to live while
 * it's sent, and remembered only once it works.
 */
export function useRememberedCamera(adapter: LiveKitAdapter) {
  const [savedCamera, setSavedCamera] = useState<string | null>(loadCameraDevice);
  const remember = useCallback((deviceId: string) => {
    saveCameraDevice(deviceId);
    setSavedCamera(deviceId);
  }, []);

  const capture = useCallback(
    (kind: StreamKind, mode: StreamMode): Promise<Capture | null> => adapter.capture(kind, mode, savedCamera),
    [adapter, savedCamera],
  );

  const pickCamera = useCallback(
    async (deviceId: string, prefs: StreamSettings) => {
      if (!adapter.getState().publishing.camera) remember(deviceId);
      else if (await adapter.pickCamera(deviceId, prefs)) remember(deviceId);
    },
    [adapter, remember],
  );

  return { savedCamera, capture, pickCamera };
}

import { useCallback, useMemo, useState } from "react";
import type { StreamKind, StreamMode, StreamSettings } from "@services/xove-api-service/types/api.types";
import type { LiveKitAdapter } from "@services/livekit-service/livekit.adapter";
import type { Capture } from "@services/livekit-service/types/livekit.types";
import { loadCameraDevice, saveCameraDevice } from "@services/preferences-service/preferences.service";

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

  return useMemo(() => ({ savedCamera, capture, pickCamera }), [savedCamera, capture, pickCamera]);
}

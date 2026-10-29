import { useCallback } from "react";
import type { StreamSettings } from "@core/api/types/api.types";

type Inputs = {
  /** Switches the camera: live while it's sent, remembered for next time either way. */
  pickOnVideo: (deviceId: string, settings: StreamSettings) => Promise<void>;
  camera: StreamSettings;
  /** The preview starts again with the new camera, when it's on. */
  restartPreview: () => Promise<void>;
};

/** Picking another camera: sent at once while live, remembered either way; a preview restarts with it. */
export function useCameraSwitch({ pickOnVideo, camera, restartPreview }: Inputs) {
  const pick = useCallback(
    async (deviceId: string) => {
      await pickOnVideo(deviceId, camera);
      await restartPreview();
    },
    [pickOnVideo, camera, restartPreview],
  );
  return useCallback((deviceId: string) => void pick(deviceId), [pick]);
}

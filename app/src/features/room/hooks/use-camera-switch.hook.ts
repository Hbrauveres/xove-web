import { useCallback } from "react";
import type { CameraSwitchInputs } from "../types/camera-switch.types";

/** Picking another camera: sent at once while live, remembered either way; a preview restarts with it. */
export function useCameraSwitch({ pickOnVideo, camera, restartPreview }: CameraSwitchInputs) {
  const pick = useCallback(
    async (deviceId: string) => {
      await pickOnVideo(deviceId, camera);
      await restartPreview();
    },
    [pickOnVideo, camera, restartPreview],
  );
  return useCallback((deviceId: string) => void pick(deviceId), [pick]);
}

import type { StreamSettings } from "@core/api/types/api.types";

export type CameraSwitchInputs = {
  /** Switches the camera: live while it's sent, remembered for next time either way. */
  pickOnVideo: (deviceId: string, settings: StreamSettings) => Promise<void>;
  camera: StreamSettings;
  /** The preview starts again with the new camera, when it's on. */
  restartPreview: () => Promise<void>;
};

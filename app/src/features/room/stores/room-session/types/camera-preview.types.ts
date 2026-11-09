import type { StreamMode, StreamSettings } from "@services/xove-api-service";
import type { Capture } from "@services/livekit-service";

export type CameraPreviewInputs = {
  capture: (kind: "camera", mode: StreamMode) => Promise<Capture | null>;
  discard: (capture: Capture) => void;
  camera: StreamSettings;
  /** My camera is being sent: no preview needed. */
  cameraSent: boolean;
};

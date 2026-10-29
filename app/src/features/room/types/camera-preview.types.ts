import type { StreamMode, StreamSettings } from "@core/api/types/api.types";
import type { Capture } from "@core/livekit/types/livekit.types";

export type CameraPreviewInputs = {
  capture: (kind: "camera", mode: StreamMode) => Promise<Capture | null>;
  discard: (capture: Capture) => void;
  camera: StreamSettings;
  /** My camera is being sent: no preview needed. */
  cameraSent: boolean;
};

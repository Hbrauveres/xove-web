import type { CameraProblem } from "@services/media-devices-service";
import type { MediaTrack } from "@services/livekit-service";

export interface SettingsCameraPreviewProps {
  /** My camera: the one being sent, or the preview's. */
  video?: MediaTrack | undefined;
  /** It's sent: LIVE, instead of "Only you see this". */
  live: boolean;
  /** Refused or missing: said in the picture's place. */
  problem?: CameraProblem | undefined;
}

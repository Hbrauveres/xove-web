import type { CameraDevice, CameraProblem } from "@services/media-devices-service";
import type { MediaTrack } from "@services/livekit-service";
import type { SettingsStream } from "../../../../types/settings.types";

/** The cameras to pick from: the list, the one chosen, and the pick. */
type SettingsCameras = {
  list: CameraDevice[];
  chosen: string | null;
  onPick: (deviceId: string) => void;
};

export interface SettingsCameraTabProps {
  /** My camera is sent. */
  live: boolean;
  /** My camera: the one being sent, or the preview's. */
  video?: MediaTrack | undefined;
  problem?: CameraProblem | undefined;
  cameras: SettingsCameras;
  /** The request the camera's picker is cued for, if any: it opens, once per request. */
  cue?: number | undefined;
  stream: SettingsStream;
}

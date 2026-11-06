import type { CameraDevice, ScreenSurface } from "@services/media-devices-service";
import type { StreamKind } from "@services/xove-api-service";

export interface StageStreamQuickProps {
  kind: StreamKind;
  /** The screen's: what it shows. */
  screenSurface?: ScreenSurface | undefined;
  /** The camera's: the browser's cameras, and the one in use. */
  cameras: CameraDevice[];
  camera: string | null;
  /** A request is on its way: nothing to change meanwhile. */
  busy: boolean;
  /** The camera's list is open. */
  listOpen: boolean;
  onListOpen: (open: boolean) => void;
  onChangeWindow: () => void;
  onPickCamera: (deviceId: string) => void;
}

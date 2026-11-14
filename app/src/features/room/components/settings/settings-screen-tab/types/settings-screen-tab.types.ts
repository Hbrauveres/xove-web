import type { ScreenSurface } from "@services/media-devices-service";
import type { SettingsStream } from "../../../../types/settings.types";

export interface SettingsScreenTabProps {
  /** My screen is shared: what's shared, and Change. */
  live: boolean;
  surface?: ScreenSurface | undefined;
  /** Shared without sound: a line on how to share it. */
  noSound?: boolean | undefined;
  onChangeWindow: () => void;
  /** The request Change is cued for, if any. */
  cue?: number | undefined;
  stream: SettingsStream;
}

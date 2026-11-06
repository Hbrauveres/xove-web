import type { ScreenSurface } from "@services/media-devices-service";

export interface StageScreenSourceProps {
  /** What my screen share shows; unknown, "Your screen". */
  surface?: ScreenSurface | undefined;
}

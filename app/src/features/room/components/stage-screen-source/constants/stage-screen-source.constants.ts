import type { ScreenSurface } from "@services/media-devices-service";

/** What a screen share shows, in words. */
export const SURFACE: Record<ScreenSurface, string> = {
  window: "A window",
  browser: "A tab",
  monitor: "Your whole screen",
};

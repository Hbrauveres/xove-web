import { VideoQuality } from "livekit-client";
import type { StreamQuality } from "@core/api/api.types";

/**
 * The highest layer to send for each quality. A screen has three layers (480p, 720p, 1080p),
 * a camera two (480p, 720p): LiveKit's layer numbers line up for both.
 */
export const TOP_LAYER: Record<StreamQuality, VideoQuality> = {
  "1080p": VideoQuality.HIGH,
  "720p": VideoQuality.MEDIUM,
  "480p": VideoQuality.LOW,
};

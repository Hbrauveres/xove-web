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

export const NOT_CONNECTED = "Not connected to the video server yet.";
export const CANT_CONNECT = "Couldn't connect to the video server.";

/** What a failed action says. */
export const COULDNT = {
  share: "Couldn't start sharing your screen.",
  camera: "Couldn't turn on your camera.",
  change: "Couldn't change what you share.",
  switchCamera: "Couldn't switch to that camera.",
} as const;

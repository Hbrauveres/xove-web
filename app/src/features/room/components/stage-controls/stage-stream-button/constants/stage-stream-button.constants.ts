import type { StreamKind } from "@services/xove-api-service";

/** Each stream's button in words: starting it, stopping it, and its drop-up's name. */
export const LABEL: Record<StreamKind, { start: string; stop: string; quick: string }> = {
  screen: { start: "Share your screen", stop: "Stop sharing your screen", quick: "What you share" },
  camera: { start: "Turn on your camera", stop: "Turn off your camera", quick: "Your camera" },
};

/** Each drop-up's width, in px: the screen's holds what's shared and Change; the camera's, its list. */
export const UP_WIDTH: Record<StreamKind, number> = { screen: 228, camera: 210 };

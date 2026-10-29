import { BEST_SCREEN } from "../constants/devices.constants";
import type { ScreenCaptureRequest } from "../types/devices.types";

/** Some browsers can't share a screen at all. */
export const canShareScreen = () => typeof navigator.mediaDevices?.getDisplayMedia === "function";

const isSafari = () => /^((?!chrome|android|crios|fxios|edg).)*safari/i.test(navigator.userAgent);

/**
 * The browser's screen picker: always the best quality (so the sharer can raise it
 * later without picking again), and the sound as played.
 */
export function screenCaptureRequest(safari = isSafari()): ScreenCaptureRequest {
  const preset = BEST_SCREEN;
  // As LiveKit does: Safari needs `max`, the others take `ideal`.
  const size = (px: number) => (safari ? { max: px } : { ideal: px });
  return {
    video: { width: size(preset.width), height: size(preset.height), frameRate: preset.fps },
    // Sharing this very tab would show the room inside the room.
    selfBrowserSurface: "exclude",
    // Music and game sound, not a voice: no microphone filters, both channels. Without
    // Xovê's own sound, so a whole-screen share doesn't send viewers their own streams back.
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
      channelCount: 2,
      restrictOwnAudio: true,
    },
    // A picked window shares its app's sound, not the whole system's (Discord included).
    windowAudio: "window",
  };
}

import { BEST_SCREEN } from "../constants/devices.constants";
import type { CaptureControllerLike, ScreenCaptureRequest } from "../types/devices.types";

/** Some browsers can't share a screen at all. */
export const canShareScreen = () => typeof navigator.mediaDevices?.getDisplayMedia === "function";

const isSafari = () => /^((?!chrome|android|crios|fxios|edg).)*safari/i.test(navigator.userAgent);

/**
 * A controller for one pick, so the browser can be asked to stay on Xovê afterwards.
 * Undefined where the browser has none (Firefox, Safari): they behave as before.
 */
export function newCaptureController(): CaptureControllerLike | undefined {
  const Controller: unknown = Reflect.get(globalThis, "CaptureController");
  if (typeof Controller !== "function") return undefined;
  const controller: CaptureControllerLike = Reflect.construct(Controller, []);
  return controller;
}

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

/**
 * Opens the browser's picker, and asks it to stay on Xovê once something is picked: by
 * default Chrome switches to the picked window or tab, and the sharer never sees the room.
 */
export async function pickScreen(): Promise<MediaStream> {
  const controller = newCaptureController();
  const request: DisplayMediaStreamOptions = { ...screenCaptureRequest(), ...(controller ? { controller } : {}) };
  const stream = await navigator.mediaDevices.getDisplayMedia(request);
  // First thing after the answer, before any other await: Chrome only accepts it now.
  try {
    controller?.setFocusBehavior?.("no-focus-change");
  } catch {
    /* A whole screen has no window to stay on; sharing goes on as before. */
  }
  return stream;
}

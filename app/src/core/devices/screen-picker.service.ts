import type { CaptureControllerLike } from "./types/devices.types";
import { screenCaptureRequest } from "./utils/screen-picker.util";

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

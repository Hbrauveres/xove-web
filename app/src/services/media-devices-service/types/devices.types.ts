import type { StreamQuality } from "@services/xove-api-service/types/api.types";

/** One of this browser's cameras, to pick in the camera's menu. */
export type CameraDevice = { deviceId: string; label: string };

/** One of this browser's microphones. */
export type MicDevice = { deviceId: string; label: string };

/** Why the camera can't be used: the browser (or the person) refused it, or there's none. */
export type CameraProblem = "blocked" | "missing" | null;

/** Why my voice couldn't start: the browser refused the mic, there's none, or it couldn't be sent. */
export type VoiceProblem = "blocked" | "missing" | "failed" | null;

/** What a screen share shows, as the browser says (`displaySurface`). */
export type ScreenSurface = "monitor" | "window" | "browser";

/** A quality a screen or a camera can be captured and sent at. */
export type StreamPreset = {
  id: StreamQuality;
  width: number;
  height: number;
  fps: number;
  /**
   * The most this quality may use, in bits per second. Set high on purpose: each
   * connection uses what the sharer's computer and network allow, up to this.
   */
  maxBitrate: number;
};

/** The noise gate between two readings: open or not, and for how long the level has been under the line. */
export type GateState = { open: boolean; heldFor: number };

/** What Xovê asks the browser for when sharing a screen (it opens the picker itself, for `windowAudio`). */
export type ScreenCaptureRequest = DisplayMediaStreamOptions & {
  audio: MediaTrackConstraints & { restrictOwnAudio: boolean };
  video: MediaTrackConstraints;
  selfBrowserSurface: "include" | "exclude";
  windowAudio: "exclude" | "window" | "system";
};

/** Chrome's `CaptureController`; TypeScript's DOM types don't know it yet. */
export type CaptureControllerLike = {
  setFocusBehavior?: (behaviour: "focus-captured-surface" | "no-focus-change") => void;
};

/** This browser's cameras and microphones. */
export type DeviceList = { cameras: CameraDevice[]; mics: MicDevice[] };

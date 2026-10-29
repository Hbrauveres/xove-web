import { STREAM_QUALITIES } from "@core/preferences/constants/preferences.constants";
import type { DeviceList, GateState, StreamPreset } from "../types/devices.types";

/** What a refused camera says: like any app, it asks once, and says how to allow it later. */
export const CAMERA_BLOCKED =
  "Your browser didn't allow the camera. Allow it for Xovê in your browser's or phone's settings, then try again.";

/** What the room says when no camera is there. */
export const CAMERA_MISSING = "No camera found.";

/**
 * From best to lowest. The ceilings are well above what a screen usually needs, so
 * nobody is held back by them, only by their own connection; the browser and LiveKit
 * lower the bitrate by themselves when a connection can't keep up. The server's monthly
 * traffic is watched outside the app.
 */
export const BEST_SCREEN: StreamPreset = { id: "1080p", width: 1920, height: 1080, fps: 30, maxBitrate: 8_000_000 };
export const SHARE_QUALITIES: readonly StreamPreset[] = [
  BEST_SCREEN,
  { id: "720p", width: 1280, height: 720, fps: 30, maxBitrate: 4_000_000 },
  { id: "480p", width: 854, height: 480, fps: 30, maxBitrate: 2_000_000 },
];

/** A camera goes up to 720p: no need for more, and it spares the upload of someone sending a screen and a camera. */
export const CAMERA_QUALITIES: readonly StreamPreset[] = SHARE_QUALITIES.filter((q) =>
  STREAM_QUALITIES.camera.includes(q.id),
);

/** How often the noise gate reads the level. */
export const TICK_MS = 10;
/** How long the gate stays open after the level drops under the line, so the ends of words aren't chopped. */
export const HOLD_MS = 250;
/** How fast the sound comes in and fades out (the gain's time constants). */
const ATTACK_MS = 10;
const RELEASE_MS = 100;
/** The gain gets about 95% there in three time constants; and a time constant is in seconds. */
const MS_PER_THREE_CONSTANTS = 3000;
export const ATTACK_TIME_CONSTANT = ATTACK_MS / MS_PER_THREE_CONSTANTS;
export const RELEASE_TIME_CONSTANT = RELEASE_MS / MS_PER_THREE_CONSTANTS;
/** How often the mic's meter reads the level: about 20 times a second. */
export const METER_MS = 50;
/** Stretches a voice's level (its RMS sits around 0.02–0.2) so speaking fills most of the meter. */
export const LEVEL_STRETCH = 6;
/** The analyser's window, for the gate and the meter alike. */
export const ANALYSER_SIZE = 512;

export const GATE_CLOSED: GateState = { open: false, heldFor: 0 };

/** The device lists before the browser has listed any. */
export const NO_DEVICES: DeviceList = { cameras: [], mics: [] };

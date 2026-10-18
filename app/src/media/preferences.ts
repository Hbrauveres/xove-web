import {
  CAMERA_QUALITIES,
  DEFAULT_CAMERA,
  DEFAULT_SHARE,
  SHARE_QUALITIES,
  type ShareMode,
  type ShareQuality,
} from "./shareSettings";

/**
 * Choices each browser remembers for next time (spec 0086). Only conveniences:
 * when the browser's storage is blocked or holds something odd, the defaults apply.
 */

export type SharePrefs = { quality: ShareQuality; mode: ShareMode };
/** How I hear what I watch. There's no quality to pick: watching is always Auto (spec 0107). */
export type WatchPrefs = { volume: number; muted: boolean };

const KEYS = {
  shareQuality: "xove.share.quality",
  shareMode: "xove.share.mode",
  cameraQuality: "xove.camera.quality",
  cameraMode: "xove.camera.mode",
  cameraDevice: "xove.camera.device",
  ambilightOn: "xove.ambilight.on",
  ambilightBrightness: "xove.ambilight.brightness",
  watchVolume: "xove.watch.volume",
  watchMuted: "xove.watch.muted",
  voiceVolume: "xove.voice.volume",
  voiceMuted: "xove.voice.muted",
  micDevice: "xove.mic.device",
  micProcessing: "xove.mic.processing",
} as const;

const qualities = SHARE_QUALITIES.map((q) => q.id as string);
const cameraQualities = CAMERA_QUALITIES.map((q) => q.id as string);

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* Private mode or blocked storage: the choice just isn't remembered. */
  }
}

export function loadSharePrefs(): SharePrefs {
  const quality = read(KEYS.shareQuality);
  const mode = read(KEYS.shareMode);
  return {
    quality:
      quality && qualities.includes(quality)
        ? (quality as ShareQuality)
        : DEFAULT_SHARE.quality,
    mode: mode === "smooth" || mode === "sharp" ? mode : DEFAULT_SHARE.mode,
  };
}

export function saveSharePrefs(prefs: SharePrefs) {
  write(KEYS.shareQuality, prefs.quality);
  write(KEYS.shareMode, prefs.mode);
}

/** The camera's quality and mode (spec 0060): 720p at most. */
export function loadCameraPrefs(): SharePrefs {
  const quality = read(KEYS.cameraQuality);
  const mode = read(KEYS.cameraMode);
  return {
    quality:
      quality && cameraQualities.includes(quality)
        ? (quality as ShareQuality)
        : DEFAULT_CAMERA.quality,
    mode: mode === "smooth" || mode === "sharp" ? mode : DEFAULT_CAMERA.mode,
  };
}

export function saveCameraPrefs(prefs: SharePrefs) {
  write(KEYS.cameraQuality, prefs.quality);
  write(KEYS.cameraMode, prefs.mode);
}

/** The camera picked in the camera's menu (spec 0098), or null for the browser's default. */
export function loadCameraDevice(): string | null {
  return read(KEYS.cameraDevice) || null;
}

export function saveCameraDevice(deviceId: string) {
  write(KEYS.cameraDevice, deviceId);
}

/** The light around the stage (spec 0104): on or off, and how bright, 0 to 1. */
export type AmbilightPrefs = { on: boolean; brightness: number };

export const DEFAULT_AMBILIGHT: AmbilightPrefs = { on: true, brightness: 0.9 };

export function loadAmbilight(): AmbilightPrefs {
  const brightness = Number(
    read(KEYS.ambilightBrightness) ?? DEFAULT_AMBILIGHT.brightness,
  );
  return {
    on: read(KEYS.ambilightOn) !== "false",
    brightness:
      Number.isFinite(brightness) && brightness >= 0 && brightness <= 1
        ? brightness
        : DEFAULT_AMBILIGHT.brightness,
  };
}

export function saveAmbilight(prefs: AmbilightPrefs) {
  write(KEYS.ambilightOn, String(prefs.on));
  write(KEYS.ambilightBrightness, String(prefs.brightness));
}

export function loadWatchPrefs(): WatchPrefs {
  const volume = Number(read(KEYS.watchVolume) ?? 1);
  return {
    volume: Number.isFinite(volume) ? Math.min(1, Math.max(0, volume)) : 1,
    muted: read(KEYS.watchMuted) === "true",
  };
}

export function saveWatchPrefs(prefs: WatchPrefs) {
  write(KEYS.watchVolume, String(prefs.volume));
  write(KEYS.watchMuted, String(prefs.muted));
}

/** How I hear the voice of the person I watch (spec 0123): its own volume and mute. */
export function loadVoiceHearing(): WatchPrefs {
  const volume = Number(read(KEYS.voiceVolume) ?? 1);
  return {
    volume: Number.isFinite(volume) ? Math.min(1, Math.max(0, volume)) : 1,
    muted: read(KEYS.voiceMuted) === "true",
  };
}

export function saveVoiceHearing(prefs: WatchPrefs) {
  write(KEYS.voiceVolume, String(prefs.volume));
  write(KEYS.voiceMuted, String(prefs.muted));
}

/** How my voice is captured (spec 0123): the mic picked and the browser's processing. */
export type VoicePrefs = {
  micId: string | null;
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
  voiceIsolation: boolean;
  /** The mic test's line, 0 to 1: sound under it isn't sent (spec 0123 prototype). */
  sensitivity: number;
};

export const DEFAULT_VOICE: VoicePrefs = {
  micId: null,
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  voiceIsolation: false,
  sensitivity: 0.12,
};

export function loadVoicePrefs(): VoicePrefs {
  let processing: Partial<VoicePrefs> = {};
  try {
    processing = JSON.parse(
      read(KEYS.micProcessing) ?? "{}",
    ) as Partial<VoicePrefs>;
  } catch {
    processing = {};
  }
  const flag = (k: keyof Omit<VoicePrefs, "micId" | "sensitivity">) =>
    typeof processing[k] === "boolean"
      ? (processing[k] as boolean)
      : DEFAULT_VOICE[k];
  return {
    micId: read(KEYS.micDevice),
    echoCancellation: flag("echoCancellation"),
    noiseSuppression: flag("noiseSuppression"),
    autoGainControl: flag("autoGainControl"),
    voiceIsolation: flag("voiceIsolation"),
    sensitivity:
      typeof processing.sensitivity === "number"
        ? processing.sensitivity
        : DEFAULT_VOICE.sensitivity,
  };
}

export function saveVoicePrefs(prefs: VoicePrefs) {
  if (prefs.micId) write(KEYS.micDevice, prefs.micId);
  const { micId: _, ...processing } = prefs;
  write(KEYS.micProcessing, JSON.stringify(processing));
}

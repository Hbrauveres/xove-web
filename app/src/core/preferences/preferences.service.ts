import type { StreamKind, StreamMode, StreamSettings } from "@core/api/types/api.types";
import {
  AMBILIGHT_KEYS,
  CAMERA_DEVICE_KEY,
  DEFAULT_AMBILIGHT,
  DEFAULT_HEARING,
  DEFAULT_STREAM_SETTINGS,
  DEFAULT_VOICE,
  HEARING_KEYS,
  MIC_DEVICE_KEY,
  MIC_PROCESSING_KEY,
  STREAM_KEYS,
  STREAM_QUALITIES,
} from "./constants/preferences.constants";
import type { AmbilightPrefs, HearingOf, HearingPrefs, VoicePrefs } from "./types/preferences.types";
import { readStored, writeStored } from "./utils/storage.util";

/** Choices each browser remembers for next time. Anything odd in the storage gives the default. */

const between0and1 = (value: number, fallback: number) =>
  Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : fallback;

const isMode = (value: string | null): value is StreamMode => value === "smooth" || value === "sharp";

/** The quality and mode I send a screen or a camera with. */
export function loadStreamSettings(kind: StreamKind): StreamSettings {
  const quality = readStored(STREAM_KEYS[kind].quality);
  const mode = readStored(STREAM_KEYS[kind].mode);
  const allowed = STREAM_QUALITIES[kind].find((q) => q === quality);
  return {
    quality: allowed ?? DEFAULT_STREAM_SETTINGS[kind].quality,
    mode: isMode(mode) ? mode : DEFAULT_STREAM_SETTINGS[kind].mode,
  };
}

export function saveStreamSettings(kind: StreamKind, settings: StreamSettings): void {
  writeStored(STREAM_KEYS[kind].quality, settings.quality);
  writeStored(STREAM_KEYS[kind].mode, settings.mode);
}

/** The camera picked in the camera's menu, or null for the browser's default. */
export function loadCameraDevice(): string | null {
  return readStored(CAMERA_DEVICE_KEY) || null;
}

export function saveCameraDevice(deviceId: string): void {
  writeStored(CAMERA_DEVICE_KEY, deviceId);
}

/** How I hear the stream I watch, or its person's voice. */
export function loadHearing(of: HearingOf): HearingPrefs {
  const keys = HEARING_KEYS[of];
  return {
    volume: between0and1(Number(readStored(keys.volume) ?? DEFAULT_HEARING.volume), DEFAULT_HEARING.volume),
    muted: readStored(keys.muted) === "true",
  };
}

export function saveHearing(of: HearingOf, prefs: HearingPrefs): void {
  writeStored(HEARING_KEYS[of].volume, String(prefs.volume));
  writeStored(HEARING_KEYS[of].muted, String(prefs.muted));
}

export function loadAmbilight(): AmbilightPrefs {
  const brightness = Number(readStored(AMBILIGHT_KEYS.brightness) ?? DEFAULT_AMBILIGHT.brightness);
  const inRange = Number.isFinite(brightness) && brightness >= 0 && brightness <= 1;
  return {
    on: readStored(AMBILIGHT_KEYS.on) !== "false",
    brightness: inRange ? brightness : DEFAULT_AMBILIGHT.brightness,
  };
}

export function saveAmbilight(prefs: AmbilightPrefs): void {
  writeStored(AMBILIGHT_KEYS.on, String(prefs.on));
  writeStored(AMBILIGHT_KEYS.brightness, String(prefs.brightness));
}

/** The processing saved as JSON, or nothing when it can't be read. */
function storedProcessing(): Partial<Record<keyof VoicePrefs, unknown>> {
  try {
    const parsed: unknown = JSON.parse(readStored(MIC_PROCESSING_KEY) ?? "{}");
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

type VoiceFlag = Exclude<keyof VoicePrefs, "micId" | "sensitivity">;

export function loadVoicePrefs(): VoicePrefs {
  const processing = storedProcessing();
  const flag = (k: VoiceFlag) => {
    const value = processing[k];
    return typeof value === "boolean" ? value : DEFAULT_VOICE[k];
  };
  const sensitivity = processing.sensitivity;
  return {
    micId: readStored(MIC_DEVICE_KEY),
    echoCancellation: flag("echoCancellation"),
    noiseSuppression: flag("noiseSuppression"),
    autoGainControl: flag("autoGainControl"),
    voiceIsolation: flag("voiceIsolation"),
    sensitivity:
      typeof sensitivity === "number"
        ? between0and1(sensitivity, DEFAULT_VOICE.sensitivity)
        : DEFAULT_VOICE.sensitivity,
  };
}

export function saveVoicePrefs(prefs: VoicePrefs): void {
  if (prefs.micId) writeStored(MIC_DEVICE_KEY, prefs.micId);
  const { micId: _, ...processing } = prefs;
  writeStored(MIC_PROCESSING_KEY, JSON.stringify(processing));
}

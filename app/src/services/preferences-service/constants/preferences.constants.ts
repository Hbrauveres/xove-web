import type { StreamKind, StreamQuality, StreamSettings } from "@services/xove-api-service";
import type { AmbilightPrefs, HearingOf, HearingPrefs, VoicePrefs } from "../types/preferences.types";

/** Where each choice is kept in the browser. Renaming one forgets everyone's choice. */
export const STREAM_KEYS: Record<StreamKind, { quality: string; mode: string }> = {
  screen: { quality: "xove.share.quality", mode: "xove.share.mode" },
  camera: { quality: "xove.camera.quality", mode: "xove.camera.mode" },
};
export const HEARING_KEYS: Record<HearingOf, { volume: string; muted: string }> = {
  stream: { volume: "xove.watch.volume", muted: "xove.watch.muted" },
  voice: { volume: "xove.voice.volume", muted: "xove.voice.muted" },
};
export const CAMERA_DEVICE_KEY = "xove.camera.device";
export const AMBILIGHT_KEYS = { on: "xove.ambilight.on", brightness: "xove.ambilight.brightness" } as const;
export const MIC_DEVICE_KEY = "xove.mic.device";
export const MIC_PROCESSING_KEY = "xove.mic.processing";

/** The qualities each kind of stream may be sent at, best first: a camera goes up to 720p. */
export const STREAM_QUALITIES: Record<StreamKind, readonly StreamQuality[]> = {
  screen: ["1080p", "720p", "480p"],
  camera: ["720p", "480p"],
};

export const DEFAULT_STREAM_SETTINGS: Record<StreamKind, StreamSettings> = {
  screen: { quality: "1080p", mode: "smooth" },
  camera: { quality: "720p", mode: "smooth" },
};

export const DEFAULT_HEARING: HearingPrefs = { volume: 1, muted: false };

export const DEFAULT_AMBILIGHT: AmbilightPrefs = { on: true, brightness: 0.9 };

export const DEFAULT_VOICE: VoicePrefs = {
  micId: null,
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  voiceIsolation: false,
  sensitivity: 0.12,
};

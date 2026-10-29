import { VideoPreset, type TrackPublishOptions, type VideoCaptureOptions, type VideoQuality } from "livekit-client";
import type { StreamMode, StreamQuality } from "@services/xove-api-service";
import { BEST_SCREEN, CAMERA_QUALITIES, SHARE_QUALITIES } from "@services/media-devices-service";
import type { StreamPreset } from "@services/media-devices-service";
import type { VoicePrefs } from "@services/preferences-service";
import { TOP_LAYER } from "../constants/livekit.constants";

/**
 * How screens and cameras are sent. LiveKit's defaults are tuned for slides and voice calls
 * (15 fps, sharpness first, voice filters on the sound); these are tuned for games and videos.
 */

/** The content hint for a mode: how the browser encodes the picture. */
export const contentHintOf = (mode: StreamMode) => (mode === "smooth" ? "motion" : "detail");

/** How the browser trades quality when the connection is tight, for a mode. */
export const degradationOf = (mode: StreamMode): RTCDegradationPreference =>
  mode === "smooth" ? "maintain-framerate" : "maintain-resolution";

/** The lower layers under a stream's best one, as LiveKit's simulcast layers. */
const layersUnder = (presets: readonly StreamPreset[]) =>
  presets.slice(1).map((l) => new VideoPreset(l.width, l.height, l.maxBitrate, l.fps));

/** The best preset of a list; every list has one. */
const bestOf = (presets: readonly StreamPreset[]): StreamPreset => presets[0] ?? BEST_SCREEN;

/**
 * How the screen is sent: VP9 (VP8 where the browser can't), always with one layer per quality
 * (1080p, 720p, 480p). The sharer's chosen quality is a cap on top of that (`capOf`), so it can
 * go up or down while sharing, with no reload.
 */
export function screenPublishOptions(mode: StreamMode): TrackPublishOptions {
  const best = bestOf(SHARE_QUALITIES);
  return {
    videoCodec: "vp9",
    backupCodec: { codec: "vp8" },
    // VP9 as real layers ("L1T3" per layer), so a viewer gets exactly 1080p, 720p or 480p.
    simulcast: true,
    scalabilityMode: "L1T3",
    screenShareEncoding: { maxBitrate: best.maxBitrate, maxFramerate: best.fps },
    screenShareSimulcastLayers: layersUnder(SHARE_QUALITIES),
    // Smooth: lower the resolution before the frame rate. Sharp: the other way round.
    degradationPreference: degradationOf(mode),
    // Stereo at music quality, and no silence skipping (it chops quiet moments).
    audioPreset: { maxBitrate: 128_000 },
    forceStereo: true,
    dtx: false,
  };
}

/**
 * What the browser asks the camera for: 720p at 30 fps (the mode's content hint is set on the
 * track when it's sent). `ideal`: when the camera picked is gone, the browser uses another.
 */
export function cameraCaptureOptions(deviceId?: string | null): VideoCaptureOptions {
  const best = bestOf(CAMERA_QUALITIES);
  return {
    resolution: { width: best.width, height: best.height, frameRate: best.fps },
    ...(deviceId ? { deviceId: { ideal: deviceId } } : {}),
  };
}

/** How my voice is captured: the mic picked and the browser's processing. */
export function micCaptureOptions(prefs: VoicePrefs) {
  return {
    ...(prefs.micId ? { deviceId: { ideal: prefs.micId } } : {}),
    echoCancellation: prefs.echoCancellation,
    noiseSuppression: prefs.noiseSuppression,
    autoGainControl: prefs.autoGainControl,
    // Only Chrome knows it yet; the others ignore it.
    voiceIsolation: prefs.voiceIsolation,
  };
}

/** How a camera is sent: like a screen (VP9, VP8 fallback), with a 720p and a 480p layer. */
export function cameraPublishOptions(mode: StreamMode): TrackPublishOptions {
  const best = bestOf(CAMERA_QUALITIES);
  return {
    videoCodec: "vp9",
    backupCodec: { codec: "vp8" },
    simulcast: true,
    scalabilityMode: "L1T3",
    videoEncoding: { maxBitrate: best.maxBitrate, maxFramerate: best.fps },
    videoSimulcastLayers: layersUnder(CAMERA_QUALITIES),
    degradationPreference: degradationOf(mode),
  };
}

/** The highest layer to send for a chosen quality. */
export function capOf(quality: StreamQuality): VideoQuality {
  return TOP_LAYER[quality];
}

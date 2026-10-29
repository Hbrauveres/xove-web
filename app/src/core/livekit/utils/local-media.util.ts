import { Track, type LocalParticipant, type LocalVideoTrack } from "livekit-client";
import type { ScreenSurface } from "@core/devices/types/devices.types";
import type { LocalMedia } from "../types/livekit.types";
import { isLocalVideo } from "./track-kind.util";

const SURFACES: readonly ScreenSurface[] = ["monitor", "window", "browser"];

/** What my screen share shows, as the browser says. */
function surfaceOf(screen: LocalVideoTrack | undefined): ScreenSurface | undefined {
  const settings: { displaySurface?: string } | undefined = screen?.mediaStreamTrack.getSettings?.();
  return SURFACES.find((s) => s === settings?.displaySurface);
}

/** What this browser sends, read from LiveKit. `micInput` is kept: LiveKit doesn't know it. */
export function readLocalMedia(me: LocalParticipant, micInput: MediaStreamTrack | undefined): LocalMedia {
  const camera = me.getTrackPublication(Track.Source.Camera)?.track;
  const screen = me.getTrackPublication(Track.Source.ScreenShare)?.track;
  const mic = me.getTrackPublication(Track.Source.Microphone)?.track;
  const video = isLocalVideo(camera) ? camera : undefined;
  return {
    publishing: { screen: me.isScreenShareEnabled, camera: Boolean(camera) },
    local: { ...(screen ? { screen } : {}), ...(camera ? { camera } : {}) },
    screenSurface: surfaceOf(isLocalVideo(screen) ? screen : undefined),
    cameraId: video?.mediaStreamTrack.getSettings?.().deviceId,
    voice: Boolean(mic),
    localVoice: mic,
    micInput,
  };
}

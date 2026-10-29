import { ConnectionState as LkState, Track, VideoQuality } from "livekit-client";
import type { StreamKind, StreamQuality } from "@services/xove-api-service/types/api.types";
import type { ConnectionState, VideoRoomState } from "../types/livekit.types";

/**
 * The highest layer to send for each quality. A screen has three layers (480p, 720p, 1080p),
 * a camera two (480p, 720p): LiveKit's layer numbers line up for both.
 */
export const TOP_LAYER: Record<StreamQuality, VideoQuality> = {
  "1080p": VideoQuality.HIGH,
  "720p": VideoQuality.MEDIUM,
  "480p": VideoQuality.LOW,
};

export const NOT_CONNECTED = "Not connected to the video server yet.";
export const CANT_CONNECT = "Couldn't connect to the video server.";

/** What a failed action says. */
export const COULDNT = {
  share: "Couldn't start sharing your screen.",
  camera: "Couldn't turn on your camera.",
  change: "Couldn't change what you share.",
  switchCamera: "Couldn't switch to that camera.",
} as const;

/** Where each kind of my streams is published. */
export const SOURCE: Record<StreamKind, Track.Source> = {
  screen: Track.Source.ScreenShare,
  camera: Track.Source.Camera,
};

/** LiveKit's connection states, as the room shows them. */
export const CONNECTION: Record<LkState, ConnectionState> = {
  [LkState.Connecting]: "connecting",
  [LkState.Connected]: "connected",
  [LkState.Reconnecting]: "reconnecting",
  [LkState.SignalReconnecting]: "reconnecting",
  [LkState.Disconnected]: "disconnected",
};

/** How many joins and leaves the room keeps. */
export const PRESENCE_KEPT = 30;

/** The room before it's joined. */
export const START: VideoRoomState = {
  publishing: { screen: false, camera: false },
  local: {},
  screenSurface: undefined,
  cameraId: undefined,
  voice: false,
  localVoice: undefined,
  micInput: undefined,
  connection: "connecting",
  others: [],
  remote: {},
  cameraProblem: null,
  presence: [],
  error: null,
};

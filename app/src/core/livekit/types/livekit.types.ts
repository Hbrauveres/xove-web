import type { NoiseGate } from "../noise-gate.adapter";
import type { LocalAudioTrack, LocalTrack, LocalVideoTrack, Room } from "livekit-client";
import type { SharingConnection, StreamKind } from "@core/api/types/api.types";
import type { CameraProblem, ScreenSurface } from "@core/devices/types/devices.types";

/** A track, reduced to what the screen needs: put it in a <video>/<audio> and take it out. */
export type MediaTrack = {
  attach(element: HTMLMediaElement): HTMLMediaElement;
  detach(element: HTMLMediaElement): HTMLMediaElement;
};

/** A quality a viewer asks for: "auto" lets the server send what fits. */
export type ViewQuality = "auto" | "1080p" | "720p" | "480p";

/** Someone's screen or camera, as received. */
export type RemoteVideo = {
  video: MediaTrack;
  /** Height of the best quality the sharer sends, when known; read as it is now. */
  readonly height?: number | undefined;
  /** How many qualities the sharer sends (1 from Firefox and Safari); read as it is now. */
  readonly layers?: number | undefined;
  /** Asks the server for this quality ("auto": whatever fits the player). */
  setQuality: (quality: ViewQuality) => void;
};

/** The connection to the video server. */
export type ConnectionState = "connecting" | "connected" | "reconnecting" | "disconnected";

/** Someone in the room, by their identity ("user-42"). */
export type RoomPerson = { identity: string; name: string };

/** What this browser receives from someone else. */
export type RemoteMedia = {
  screen?: RemoteVideo;
  camera?: RemoteVideo;
  /** The sound of their screen, while it's downloaded. */
  sound?: MediaTrack;
  /** They share their screen's sound. */
  hasSound: boolean;
  /** Downloads the sound of their screen, or stops downloading it. */
  setSoundOn: (on: boolean) => void;
  /** Their voice, while it's downloaded. */
  voice?: MediaTrack;
  /** Their voice is on and not muted by them. */
  hasVoice: boolean;
  /** Speaking right now (the video server's own detection). */
  speaking: boolean;
  /** Downloads their voice, or stops downloading it. */
  setVoiceOn: (on: boolean) => void;
};

/** What this browser sends. */
export type LocalMedia = {
  publishing: Record<StreamKind, boolean>;
  /** My own screen and camera, for the previews. */
  local: Partial<Record<StreamKind, MediaTrack>>;
  /** What my screen share shows: a window, a tab ("browser") or the whole screen ("monitor"). */
  screenSurface: ScreenSurface | undefined;
  /** The camera being sent, by its device id. */
  cameraId: string | undefined;
  /** My voice is being sent. */
  voice: boolean;
  localVoice: MediaTrack | undefined;
  /** My mic as captured, before the gate: what the level meter reads. */
  micInput: MediaStreamTrack | undefined;
};

/** Someone joined or left, as this page saw it. */
type PresenceEvent = { id: number; kind: "joined" | "left"; identity: string; at: number };

/** Everything the room shows about the video server, kept per person. */
export type VideoRoomState = LocalMedia & {
  connection: ConnectionState;
  /** Everyone else, in the order they arrived. */
  others: RoomPerson[];
  /** What others send, by identity. */
  remote: Record<string, RemoteMedia>;
  cameraProblem: CameraProblem;
  presence: PresenceEvent[];
  error: string | null;
};

/** A screen or a camera being captured but not sent yet. Its tracks stay in the adapter. */
export type Capture = {
  kind: StreamKind;
  /** What the person sees in the preview. */
  preview: MediaTrack;
  /** The browser gave the screen's sound. */
  hasSound: boolean;
  /** Calls back when the browser stops the capture (unplugged, or its own control). Returns how to stop watching. */
  onEnded: (callback: () => void) => () => void;
};

/** A stream that just started: where it comes from, and whether the browser gave its sound. */
export type StartedStream = SharingConnection & { hasSound: boolean };

/** What a capture holds inside the adapter: LiveKit's tracks, never handed out. */
export type CapturedTracks = { video: LocalVideoTrack & LocalTrack; audio?: LocalAudioTrack & LocalTrack };

/** What the adapter's services share: the room while connected, the state to change, the captures. */
export type RoomContext = {
  room: () => Room | null;
  state: () => VideoRoomState;
  update: (patch: Partial<VideoRoomState>) => void;
  /** Reads again what this browser sends, with what LiveKit can't know (`micInput`), in one change. */
  refreshLocal: (known?: Pick<LocalMedia, "micInput">) => void;
  captures: WeakMap<Capture, CapturedTracks>;
};

/** My voice's noise gate, with the Web Audio context it runs in. */
export type Gate = { gate: NoiseGate; context: AudioContext };

/** Anything that carries the browser's track, as a camera does. */
export type WithMediaTrack = { mediaStreamTrack: MediaStreamTrack };

/** A new window or screen picked while sharing: whether it came with its sound. */
export type ScreenChange = { hasSound: boolean };

import type { StreamKind, StreamSettings } from "@core/api/api.types";
import type { MediaTrack, RemoteVideo } from "@core/livekit/livekit.types";

/** A person in the room. `id` is their LiveKit identity ("user-42"), or "me". */
export type Friend = {
  id: string;
  name: string;
  /** Hue for the avatar background, 0–360. */
  hue: number;
  online: boolean;
};

/** One live stream on the stage: what the API says about it, and its video once it arrives. */
export type LiveFeed = {
  kind: StreamKind;
  startedAt: number;
  /** The quality and mode it's sent with: caps what viewers can pick. */
  settings: StreamSettings;
  /** Someone else's video, once it arrives. */
  remote?: RemoteVideo;
  /** My own video, for my preview. */
  local?: MediaTrack;
};

/** A person with at least one live stream. */
export type Sharer = {
  person: Friend;
  isMe: boolean;
  /** When their oldest live stream started: the longest sharing comes first. */
  since: number;
  screen?: LiveFeed;
  camera?: LiveFeed;
  /** The sound of their screen, when it's someone else's and it's downloaded. */
  sound?: MediaTrack;
  /** They share their screen's sound (whether it's downloaded or not). */
  hasSound?: boolean;
  /** Downloads their sound, or not (a muted thumbnail's isn't downloaded). Only for someone else. */
  setSoundOn?: (on: boolean) => void;
  /** Their voice (spec 0123), when it's someone else's and it's downloaded. */
  voice?: MediaTrack;
  /** Their voice is on (and not muted by them). */
  hasVoice?: boolean;
  /** Speaking right now. */
  speaking?: boolean;
  /** Downloads their voice, or not. Only for someone else. */
  setVoiceOn?: (on: boolean) => void;
};

/** Numbers the real app would read from LiveKit's track stats. */
export type StreamStats = {
  width: number;
  height: number;
  fps: number;
  codec: "VP9" | "VP8" | "H.264" | "AV1";
  bitrateMbps: number;
  latencyMs: number;
};

/** "reconnected": my connection came back after dropping (spec 0104). */
export type ActivityKind = "joined" | "left" | "started" | "stopped" | "reconnected";

export type ActivityEvent = {
  id: string;
  at: number;
  kind: ActivityKind;
  actorId: string;
  /** For "started" and "stopped": which stream. */
  stream?: StreamKind;
};

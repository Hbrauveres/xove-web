import { Track, type LocalAudioTrack, type LocalTrack, type LocalVideoTrack } from "livekit-client";

/**
 * Which kind a track is, checked on the track itself. Each guard also says the track is one of
 * LiveKit's local tracks: with `exactOptionalPropertyTypes`, LiveKit's own types don't let a
 * `LocalAudioTrack` pass where a `LocalTrack` is asked for (their `processor` fields disagree).
 */
const ofKind = (t: unknown, kind: Track.Kind) =>
  typeof t === "object" && t !== null && "kind" in t && t.kind === kind && "mediaStreamTrack" in t;

export const isLocalVideo = (t: unknown): t is LocalVideoTrack & LocalTrack => ofKind(t, Track.Kind.Video);

export const isLocalAudio = (t: unknown): t is LocalAudioTrack & LocalTrack => ofKind(t, Track.Kind.Audio);

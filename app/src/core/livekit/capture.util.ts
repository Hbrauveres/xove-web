import { LocalAudioTrack, Track } from "livekit-client";
import type { StreamKind } from "@core/api/api.types";
import { COULDNT } from "./livekit.constants";
import { isLocalAudio } from "./track-kind.util";

export const isDomError = (e: unknown, name: string) => e instanceof DOMException && e.name === name;

/** What a failed start says, for a screen or a camera. */
export const startFailed = (kind: StreamKind) => (kind === "screen" ? COULDNT.share : COULDNT.camera);

/** A screen's sound, wrapped the way LiveKit's own capture does. */
export function screenSound(sound: MediaStreamTrack) {
  // No audio context: LiveKit only needs it for track processors, which a screen's sound doesn't use.
  const audio = new LocalAudioTrack(sound, undefined, false);
  audio.source = Track.Source.ScreenShareAudio;
  if (!isLocalAudio(audio)) throw new Error("not a sound track");
  return audio;
}

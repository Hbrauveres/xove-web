import { LocalAudioTrack, Track } from "livekit-client";
import { isLocalAudio } from "./utils/track-kind.util";

/** A screen's sound, wrapped the way LiveKit's own capture does. */
export function screenSound(sound: MediaStreamTrack) {
  // No audio context: LiveKit only needs it for track processors, which a screen's sound doesn't use.
  const audio = new LocalAudioTrack(sound, undefined, false);
  audio.source = Track.Source.ScreenShareAudio;
  if (!isLocalAudio(audio)) throw new Error("not a sound track");
  return audio;
}

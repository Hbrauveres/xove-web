import { useEffect, useRef } from "react";
import type { MediaTrack } from "../../types";

/** Plays someone's voice (spec 0123), at this browser's own volume; nothing to see. */
export function VoiceAudio({ track, volume, muted }: { track: MediaTrack; volume: number; muted: boolean }) {
  const ref = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    track.attach(el);
    return () => {
      track.detach(el);
    };
  }, [track]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.volume = volume;
    el.muted = muted;
  }, [volume, muted, track]);
  return <audio ref={ref} autoPlay data-voice-audio />;
}

import { useEffect, useRef, type RefObject } from "react";
import type { MediaTrack } from "@services/livekit-service";
import type { Playback } from "../types/played-track.types";

/**
 * A video or audio element playing a track: attached while both are there, let go when either
 * goes, at this browser's volume when one is given. Hand the returned ref to the element.
 */
export function usePlayedTrack<T extends HTMLMediaElement>(
  track: MediaTrack | undefined,
  playback?: Playback,
): RefObject<T | null> {
  const element = useRef<T>(null);
  useEffect(() => {
    const el = element.current;
    if (!el || !track) return;
    track.attach(el);
    return () => {
      track.detach(el);
    };
  }, [track]);
  const volume = playback?.volume;
  const muted = playback?.muted;
  useEffect(() => {
    const el = element.current;
    // A new track starts at the element's defaults: set them again.
    if (!el || volume === undefined || muted === undefined || !track) return;
    el.volume = volume;
    el.muted = muted;
  }, [volume, muted, track]);
  return element;
}

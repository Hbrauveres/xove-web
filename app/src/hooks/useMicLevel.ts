import { useEffect, useState } from "react";
import type { MediaTrack } from "../types";

/**
 * My mic's live level, 0 to 1 (spec 0123), read with one small audio analyser about 20 times a
 * second, only while asked (the Voice tab open). 0 where the browser can't read the track.
 */
export function useMicLevel(track: MediaTrack | undefined, on: boolean): number {
  const [level, setLevel] = useState(0);
  useEffect(() => {
    const raw = (track as { mediaStreamTrack?: unknown } | undefined)?.mediaStreamTrack;
    if (!on || typeof MediaStreamTrack === "undefined" || !(raw instanceof MediaStreamTrack) || typeof AudioContext === "undefined") {
      setLevel(0);
      return;
    }
    const context = new AudioContext();
    const analyser = context.createAnalyser();
    analyser.fftSize = 512;
    context.createMediaStreamSource(new MediaStream([raw])).connect(analyser);
    const samples = new Float32Array(analyser.fftSize);
    const timer = window.setInterval(() => {
      analyser.getFloatTimeDomainData(samples);
      let sum = 0;
      for (const s of samples) sum += s * s;
      // A voice's RMS sits around 0.02–0.2: stretch it so speaking fills most of the bar.
      setLevel(Math.min(1, Math.sqrt(sum / samples.length) * 6));
    }, 50);
    return () => {
      window.clearInterval(timer);
      void context.close();
    };
  }, [track, on]);
  return level;
}

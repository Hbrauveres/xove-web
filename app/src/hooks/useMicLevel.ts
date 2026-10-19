import { useEffect, useState } from "react";
import { levelOf } from "../media/noiseGate";

/**
 * My mic's live level, 0 to 1 (spec 0123), on the noise gate's own scale (so the sensitivity
 * line means the same in both), read with one small audio analyser about 20 times a second, only
 * while asked (the Voice tab open). 0 where the browser can't read it.
 */
export function useMicLevel(input: MediaStreamTrack | undefined, on: boolean): number {
  const [level, setLevel] = useState(0);
  useEffect(() => {
    if (!on || !input || typeof MediaStreamTrack === "undefined" || !(input instanceof MediaStreamTrack) || typeof AudioContext === "undefined") {
      setLevel(0);
      return;
    }
    const context = new AudioContext();
    const analyser = context.createAnalyser();
    analyser.fftSize = 512;
    context.createMediaStreamSource(new MediaStream([input])).connect(analyser);
    const samples = new Float32Array(analyser.fftSize);
    const timer = window.setInterval(() => {
      analyser.getFloatTimeDomainData(samples);
      setLevel(levelOf(samples));
    }, 50);
    return () => {
      window.clearInterval(timer);
      void context.close();
    };
  }, [input, on]);
  return level;
}

import { levelOf } from "./audio-level.util";
import { ANALYSER_SIZE, METER_MS } from "./devices.constants";

/**
 * Reads a mic's level, 0 to 1, on the noise gate's own scale (so the sensitivity line means
 * the same in both), with one small audio analyser. Returns the way to stop, or nothing where
 * the browser can't read it.
 */
export function startMicMeter(input: MediaStreamTrack, onLevel: (level: number) => void): (() => void) | null {
  if (typeof AudioContext === "undefined" || typeof MediaStreamTrack === "undefined") return null;
  if (!(input instanceof MediaStreamTrack)) return null;
  const context = new AudioContext();
  const analyser = context.createAnalyser();
  analyser.fftSize = ANALYSER_SIZE;
  context.createMediaStreamSource(new MediaStream([input])).connect(analyser);
  const samples = new Float32Array(analyser.fftSize);
  const timer = window.setInterval(() => {
    analyser.getFloatTimeDomainData(samples);
    onLevel(levelOf(samples));
  }, METER_MS);
  return () => {
    window.clearInterval(timer);
    void context.close();
  };
}

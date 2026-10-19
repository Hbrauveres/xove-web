import type { AudioProcessorOptions, Track, TrackProcessor } from "livekit-client";

/**
 * The voice's noise gate (spec 0123, ADR-0071): sound under the sharer's sensitivity line isn't
 * sent. It opens at once when the level crosses the line, stays open 250 ms after it drops back,
 * then fades in 100 ms, so the ends of words aren't chopped.
 */

/** How often the gate reads the level. */
export const TICK_MS = 10;
/** How long it stays open after the level drops under the line. */
export const HOLD_MS = 250;
/** How fast the sound comes in and fades out (the gain's time constants). */
export const ATTACK_MS = 10;
export const RELEASE_MS = 100;

/** The level of a stretch of samples, 0 to 1: the meter's own scale, so the line means the same. */
export function levelOf(samples: Float32Array): number {
  let sum = 0;
  for (const s of samples) sum += s * s;
  // A voice's RMS sits around 0.02–0.2: stretched so speaking fills most of the meter.
  return Math.min(1, Math.sqrt(sum / (samples.length || 1)) * 6);
}

export type GateState = { open: boolean; heldFor: number };
export const CLOSED: GateState = { open: false, heldFor: 0 };

/** One reading: the gate after a `level` against the `line`, `dt` ms after the last one. */
export function gateStep(state: GateState, level: number, line: number, dt: number): GateState {
  if (line <= 0 || level >= line) return { open: true, heldFor: 0 };
  if (!state.open) return state;
  const heldFor = state.heldFor + dt;
  return heldFor >= HOLD_MS ? CLOSED : { open: true, heldFor };
}

/**
 * The gate as LiveKit's audio processor: the microphone goes through a gain that the gate opens
 * and closes, read from an analyser every 10 ms. Web Audio only; it runs while the voice is on.
 */
export class NoiseGate implements TrackProcessor<Track.Kind.Audio, AudioProcessorOptions> {
  name = "xove-noise-gate";
  processedTrack?: MediaStreamTrack;
  /** The microphone itself, before the gate: what the level meter reads. */
  input?: MediaStreamTrack;
  private line: number;
  private stop?: () => void;

  constructor(line: number) {
    this.line = line;
  }

  /** Moves the line, live. */
  setLine(line: number) {
    this.line = line;
  }

  async init({ track, audioContext }: AudioProcessorOptions) {
    this.input = track;
    const source = audioContext.createMediaStreamSource(new MediaStream([track]));
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    const gain = audioContext.createGain();
    const out = audioContext.createMediaStreamDestination();
    source.connect(analyser);
    source.connect(gain).connect(out);
    gain.gain.value = 0;
    const samples = new Float32Array(analyser.fftSize);
    let state = CLOSED;
    const timer = window.setInterval(() => {
      analyser.getFloatTimeDomainData(samples);
      const was = state.open;
      state = gateStep(state, levelOf(samples), this.line, TICK_MS);
      if (state.open !== was) {
        gain.gain.setTargetAtTime(state.open ? 1 : 0, audioContext.currentTime, (state.open ? ATTACK_MS : RELEASE_MS) / 3000);
      }
    }, TICK_MS);
    this.processedTrack = out.stream.getAudioTracks()[0];
    this.stop = () => {
      window.clearInterval(timer);
      source.disconnect();
      gain.disconnect();
    };
  }

  async restart(opts: AudioProcessorOptions) {
    await this.destroy();
    await this.init(opts);
  }

  async destroy() {
    this.stop?.();
    this.stop = undefined;
    this.processedTrack?.stop();
    this.processedTrack = undefined;
  }
}

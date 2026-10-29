import type { AudioProcessorOptions, Track, TrackProcessor } from "livekit-client";
import { gateStep, levelOf } from "@services/media-devices-service/utils/audio-level.util";
import {
  ANALYSER_SIZE,
  ATTACK_TIME_CONSTANT,
  GATE_CLOSED,
  RELEASE_TIME_CONSTANT,
  TICK_MS,
} from "@services/media-devices-service/constants/devices.constants";

/**
 * The voice's noise gate as LiveKit's audio processor: sound under the sharer's sensitivity line
 * isn't sent. The microphone goes through a gain that the gate opens and closes, read from an
 * analyser every tick; it fades so the ends of words aren't chopped. Web Audio only.
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
    analyser.fftSize = ANALYSER_SIZE;
    const gain = audioContext.createGain();
    const out = audioContext.createMediaStreamDestination();
    source.connect(analyser);
    source.connect(gain).connect(out);
    gain.gain.value = 0;
    const samples = new Float32Array(analyser.fftSize);
    let state = GATE_CLOSED;
    const timer = window.setInterval(() => {
      analyser.getFloatTimeDomainData(samples);
      const was = state.open;
      state = gateStep(state, levelOf(samples), this.line, TICK_MS);
      if (state.open !== was) {
        gain.gain.setTargetAtTime(
          state.open ? 1 : 0,
          audioContext.currentTime,
          state.open ? ATTACK_TIME_CONSTANT : RELEASE_TIME_CONSTANT,
        );
      }
    }, TICK_MS);
    const [processed] = out.stream.getAudioTracks();
    if (processed) this.processedTrack = processed;
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
    delete this.stop;
    this.processedTrack?.stop();
    delete this.processedTrack;
  }
}

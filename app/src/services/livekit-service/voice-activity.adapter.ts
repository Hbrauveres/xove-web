import { ANALYSER_SIZE, GATE_CLOSED, gateStep, levelOf } from "@services/media-devices-service";
import { ACTIVITY_LINE, ACTIVITY_TICK_MS } from "./constants/livekit.constants";

/**
 * Who's speaking, measured from what this browser hears: one audio context, a small
 * analyser per voice, its level through the noise gate's own maths: on at once when it crosses a
 * line just above silence, off once it has stayed under it for the gate's hold.
 */
export class VoiceActivity {
  private context: AudioContext | null = null;
  private readonly newContext: () => AudioContext;

  constructor(newContext: () => AudioContext = () => new AudioContext()) {
    this.newContext = newContext;
  }

  /** Reads `track`, telling `onChange` each time it starts or stops speaking. Returns how to stop. */
  watch(track: MediaStreamTrack, onChange: (speaking: boolean) => void): () => void {
    this.context ??= this.newContext();
    const source = this.context.createMediaStreamSource(new MediaStream([track]));
    const analyser = this.context.createAnalyser();
    analyser.fftSize = ANALYSER_SIZE;
    source.connect(analyser);
    const samples = new Float32Array(analyser.fftSize);
    let state = GATE_CLOSED;
    const timer = window.setInterval(() => {
      analyser.getFloatTimeDomainData(samples);
      const next = gateStep(state, levelOf(samples), ACTIVITY_LINE, ACTIVITY_TICK_MS);
      if (next.open !== state.open) onChange(next.open);
      state = next;
    }, ACTIVITY_TICK_MS);
    return () => {
      window.clearInterval(timer);
      source.disconnect();
    };
  }

  /** Lets it hear: browsers keep a context silent until the page's first click. */
  async resume() {
    if (this.context?.state === "suspended") await this.context.resume();
  }

  /** Lets its audio go, with the room. */
  close() {
    void this.context?.close().catch(() => {});
    this.context = null;
  }
}

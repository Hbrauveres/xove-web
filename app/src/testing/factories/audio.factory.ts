import { vi } from "vitest";

/**
 * The browser's audio for a test: an AudioContext whose analyser always hears `sample`, and the
 * MediaStream classes jsdom lacks. Stubbed on the globals; the setup unstubs them after each test.
 */
export function stubAudio(sample = 0.1) {
  const closed = vi.fn(async () => {});
  class FakeTrack {}
  class FakeStream {}
  class FakeContext {
    state = "running";
    createAnalyser() {
      return { fftSize: 512, getFloatTimeDomainData: (samples: Float32Array) => samples.fill(sample) };
    }
    createMediaStreamSource() {
      return { connect: () => {} };
    }
    close = closed;
  }
  vi.stubGlobal("MediaStreamTrack", FakeTrack);
  vi.stubGlobal("MediaStream", FakeStream);
  vi.stubGlobal("AudioContext", FakeContext);
  return { track: () => new FakeTrack() as MediaStreamTrack, closed };
}

/**
 * The browser's audio, for tests: an audio context whose analysers hear, for each track, the level
 * the test sets (`speak(track, on)`), so who's speaking is measured as in the app. Fake timers drive
 * its readings.
 */
export function stubVoiceLevels({ suspended = false } = {}) {
  const levels = new Map<unknown, number>();
  class FakeMediaStream {
    readonly tracks: unknown[];
    constructor(tracks: unknown[] = []) {
      this.tracks = tracks;
    }
  }
  class FakeAudioContext {
    // As a browser before the page's first click: silent until resumed.
    state = suspended ? "suspended" : "running";
    resume = vi.fn(async () => {
      this.state = "running";
    });
    close = vi.fn(async () => {});
    createMediaStreamSource(stream: FakeMediaStream) {
      const track = stream.tracks[0];
      // Connected to an analyser, it hears this track.
      return { connect: (analyser: { track?: unknown }) => Object.assign(analyser, { track }), disconnect: vi.fn() };
    }
    createAnalyser() {
      const analyser: { fftSize: number; track?: unknown; getFloatTimeDomainData: (s: Float32Array) => void } = {
        fftSize: 0,
        getFloatTimeDomainData: (s) => s.fill(this.state === "running" ? (levels.get(analyser.track) ?? 0) : 0),
      };
      return analyser;
    }
  }
  vi.stubGlobal("MediaStream", FakeMediaStream);
  vi.stubGlobal("AudioContext", FakeAudioContext);
  return {
    /** The track starts or stops sounding (a soft voice when on). */
    speak: (track: unknown, on: boolean) => levels.set(track, on ? 0.05 : 0),
  };
}

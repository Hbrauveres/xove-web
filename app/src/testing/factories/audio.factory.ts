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

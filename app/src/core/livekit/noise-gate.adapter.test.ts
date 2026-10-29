import { describe, expect, it, vi } from "vitest";
import { HOLD_MS, TICK_MS } from "../devices/constants/devices.constants";
import { NoiseGate } from "./noise-gate.adapter";
import { ANALYSER_SIZE } from "../devices/constants/devices.constants";

/** A Web Audio graph whose analyser hears `level.sample`, and whose gain records where it's sent. */
function audioGraph() {
  const level = { sample: 0 };
  const gainTargets: number[] = [];
  const node = () => ({ connect: (next: unknown) => next, disconnect: vi.fn() });
  const context = {
    currentTime: 0,
    createMediaStreamSource: node,
    createAnalyser: () => ({
      ...node(),
      fftSize: ANALYSER_SIZE,
      getFloatTimeDomainData: (s: Float32Array) => s.fill(level.sample),
    }),
    createGain: () => ({ ...node(), gain: { value: 0, setTargetAtTime: (v: number) => gainTargets.push(v) } }),
    createMediaStreamDestination: () => ({ stream: { getAudioTracks: () => [{ stop: vi.fn() }] } }),
  };
  vi.stubGlobal("MediaStream", class {});
  return { level, gainTargets, options: { track: {}, audioContext: context } as never };
}

describe("the noise gate on my voice", () => {
  it("lets the voice through above the line, and closes after the hold below it", async () => {
    vi.useFakeTimers();
    const graph = audioGraph();
    const gate = new NoiseGate(0.3);
    await gate.init(graph.options);

    graph.level.sample = 0.1; // level 0.6, above the line
    vi.advanceTimersByTime(TICK_MS);
    expect(graph.gainTargets).toEqual([1]);

    graph.level.sample = 0;
    vi.advanceTimersByTime(HOLD_MS + TICK_MS);
    expect(graph.gainTargets).toEqual([1, 0]);
    await gate.destroy();
  });

  it("moves the line live: a raised line closes the gate on the same voice", async () => {
    vi.useFakeTimers();
    const graph = audioGraph();
    const gate = new NoiseGate(0.3);
    await gate.init(graph.options);
    graph.level.sample = 0.1;
    vi.advanceTimersByTime(TICK_MS);

    gate.setLine(0.9);
    vi.advanceTimersByTime(HOLD_MS + TICK_MS);

    expect(graph.gainTargets.at(-1)).toBe(0);
    await gate.destroy();
  });
});

import { describe, expect, it, vi } from "vitest";
import { ANALYSER_SIZE, HOLD_MS } from "../media-devices-service";
import { ACTIVITY_TICK_MS } from "./constants/livekit.constants";
import { VoiceActivity } from "./voice-activity.adapter";

/** An audio context whose analysers hear `level.sample`; it records what's disconnected and resumed. */
function audio() {
  const level = { sample: 0 };
  const disconnected = vi.fn();
  const context = {
    state: "suspended",
    resume: vi.fn(async () => {
      context.state = "running";
    }),
    close: vi.fn(async () => {}),
    createMediaStreamSource: () => ({ connect: (next: unknown) => next, disconnect: disconnected }),
    createAnalyser: () => ({
      fftSize: ANALYSER_SIZE,
      getFloatTimeDomainData: (s: Float32Array) => s.fill(level.sample),
    }),
  };
  vi.stubGlobal("MediaStream", class {});
  // Each test's own voice track, heard through its own context.
  const track = {} as MediaStreamTrack;
  return { level, disconnected, context, track, activity: new VoiceActivity(() => context as never) };
}

describe("who's speaking, measured from what's heard", () => {
  it("is on at once while sound plays, and off only after the hold once it stops", () => {
    vi.useFakeTimers();
    const { level, activity, track } = audio();
    const changes: boolean[] = [];
    activity.watch(track, (on) => changes.push(on));

    level.sample = 0.05; // a voice, softly
    vi.advanceTimersByTime(ACTIVITY_TICK_MS);
    expect(changes).toEqual([true]);

    level.sample = 0;
    vi.advanceTimersByTime(HOLD_MS - ACTIVITY_TICK_MS);
    expect(changes).toEqual([true]);
    vi.advanceTimersByTime(ACTIVITY_TICK_MS * 2);
    expect(changes).toEqual([true, false]);
  });

  it("says nothing in silence, and stops reading once told to", () => {
    vi.useFakeTimers();
    const { level, disconnected, activity, track } = audio();
    const changes: boolean[] = [];
    const stop = activity.watch(track, (on) => changes.push(on));
    vi.advanceTimersByTime(ACTIVITY_TICK_MS * 10);
    expect(changes).toEqual([]);
    stop();
    expect(disconnected).toHaveBeenCalled();
    level.sample = 0.3;
    vi.advanceTimersByTime(ACTIVITY_TICK_MS * 10);
    expect(changes).toEqual([]);
  });

  it("starts its sound with the room's (a context waits for the first click), and closes", async () => {
    const { context, activity, track } = audio();
    activity.watch(track, () => {});
    await activity.resume();
    expect(context.resume).toHaveBeenCalled();
    activity.close();
    expect(context.close).toHaveBeenCalled();
  });
});

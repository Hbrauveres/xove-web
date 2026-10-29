import { describe, expect, it, vi } from "vitest";
import { stubAudio } from "../../../test/factories/audio.factory";
import { startMicMeter } from "../mic-meter.service";

describe("the mic's meter", () => {
  it("reads the level about 20 times a second, on the gate's scale, until stopped", () => {
    vi.useFakeTimers();
    const audio = stubAudio(0.1);
    const onLevel = vi.fn();

    const stop = startMicMeter(audio.track(), onLevel)!;
    vi.advanceTimersByTime(100);
    stop();
    vi.advanceTimersByTime(100);

    expect(onLevel).toHaveBeenCalledTimes(2);
    expect(onLevel.mock.lastCall![0]).toBeCloseTo(0.6);
    expect(audio.closed).toHaveBeenCalled();
  });

  it("reads nothing where the browser has no Web Audio", () => {
    vi.stubGlobal("AudioContext", undefined);
    expect(startMicMeter({} as MediaStreamTrack, vi.fn())).toBeNull();
  });
});

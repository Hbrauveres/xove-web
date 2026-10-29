import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { stubAudio } from "../../../testing/factories/audio.factory";
import { useMicLevel } from "./use-mic-level.hook";

describe("my mic's level", () => {
  it("follows the mic while asked, and is 0 when not", () => {
    vi.useFakeTimers();
    const audio = stubAudio(0.1);
    const mic = audio.track();
    const hook = renderHook(({ on }) => useMicLevel(mic, on), { initialProps: { on: true } });

    act(() => {
      vi.advanceTimersByTime(60);
    });
    expect(hook.result.current).toBeCloseTo(0.6);

    hook.rerender({ on: false });
    expect(hook.result.current).toBe(0);
    expect(audio.closed).toHaveBeenCalled();
  });
});

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { onFakeClock } from "@testing/factories/clock.factory";
import { IDLE_MS } from "../../../constants/sound-slider.constants";
import type { Hearing } from "../../../types/sound.types";
import { useHearRow } from "./use-hear-row.hook";

const heard: Hearing = { sound: { volume: 1, muted: false }, voice: { volume: 0.5, muted: true } };

describe("useHearRow", () => {
  it("opens a sound's slider, tells while it's open, and closes it once untouched", () => {
    onFakeClock();
    const onActive = vi.fn();
    const { result } = renderHook(() => useHearRow(heard, vi.fn(), onActive));
    act(() => result.current.show("voice"));
    expect(result.current.open).toBe("voice");
    expect(onActive).toHaveBeenLastCalledWith(true);
    act(() => vi.advanceTimersByTime(IDLE_MS));
    expect(result.current.open).toBeNull();
    expect(onActive).toHaveBeenLastCalledWith(false);
  });

  it("mutes or unmutes a sound, and a new volume turns it on", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useHearRow(heard, onChange));
    act(() => result.current.toggle("voice"));
    expect(onChange).toHaveBeenLastCalledWith({ ...heard, voice: { volume: 0.5, muted: false } });
    act(() => result.current.setVolume("sound", 0.2));
    expect(onChange).toHaveBeenLastCalledWith({ ...heard, sound: { volume: 0.2, muted: false } });
  });
});

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { onFakeClock } from "@testing/factories/clock.factory";
import { REST_MS } from "../../../../constants/sound-slider.constants";
import { useViewerSound } from "./use-viewer-sound.hook";

const sound = (over = {}) => ({ volume: 1, muted: false, onChange: vi.fn(), ...over });

describe("useViewerSound", () => {
  it("opens its slider once the mouse rests on it", () => {
    onFakeClock();
    const setOpen = vi.fn();
    const { result } = renderHook(() => useViewerSound("sound", sound(), false, setOpen));
    act(() => result.current.rest());
    act(() => vi.advanceTimersByTime(REST_MS));
    expect(setOpen).toHaveBeenCalledWith("sound");
  });

  it("never opens one for a sound that can't be heard", () => {
    const setOpen = vi.fn();
    const { result } = renderHook(() =>
      useViewerSound("sound", sound({ unavailable: "No screen sound" }), false, setOpen),
    );
    act(() => result.current.show());
    expect(setOpen).not.toHaveBeenCalled();
  });

  it("a new volume turns the sound on", () => {
    const s = sound({ muted: true });
    const { result } = renderHook(() => useViewerSound("voice", s, true, vi.fn()));
    act(() => result.current.setVolume(0.4));
    expect(s.onChange).toHaveBeenCalledWith({ volume: 0.4, muted: false });
  });
});

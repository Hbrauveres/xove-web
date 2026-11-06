import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { onFakeClock } from "@testing/factories/clock.factory";
import { IDLE_MS, LEAVE_MS, REST_MS } from "../constants/sound-slider.constants";
import { useHoldOrRest } from "./use-hold-or-rest.hook";

const setup = () => {
  onFakeClock();
  const close = vi.fn();
  const open = vi.fn();
  const { result, unmount } = renderHook(() => useHoldOrRest(close));
  return { timing: result.current, result, open, close, unmount };
};

describe("useHoldOrRest", () => {
  it("opens once the mouse rests, not before", () => {
    const { timing, open } = setup();
    timing.rest(open);
    vi.advanceTimersByTime(REST_MS - 1);
    expect(open).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(open).toHaveBeenCalledOnce();
  });

  it("doesn't open when the mouse leaves before it rests", () => {
    const { timing, open } = setup();
    timing.rest(open);
    timing.leave(false);
    vi.advanceTimersByTime(REST_MS);
    expect(open).not.toHaveBeenCalled();
  });

  it("closes a while after the mouse leaves, when leaving closes", () => {
    const { timing, close } = setup();
    timing.leave(true);
    vi.advanceTimersByTime(LEAVE_MS - 1);
    expect(close).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(close).toHaveBeenCalledOnce();
  });

  it("stays open when the mouse comes back before it closes", () => {
    const { timing, open, close } = setup();
    timing.leave(true);
    timing.rest(open);
    vi.advanceTimersByTime(LEAVE_MS);
    expect(close).not.toHaveBeenCalled();
  });

  it("closes once untouched for a while, each touch starting it again", () => {
    const { timing, open, close } = setup();
    timing.rest(open);
    vi.advanceTimersByTime(REST_MS + IDLE_MS - 1);
    timing.touch();
    vi.advanceTimersByTime(IDLE_MS - 1);
    expect(close).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(close).toHaveBeenCalledOnce();
  });

  it("hands back the same functions every render, and leaves nothing running once gone", () => {
    const { timing, result, open, close, unmount } = setup();
    expect(result.current).toBe(timing);
    timing.rest(open);
    unmount();
    vi.advanceTimersByTime(REST_MS + IDLE_MS);
    expect(open).not.toHaveBeenCalled();
    expect(close).not.toHaveBeenCalled();
  });
});

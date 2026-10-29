import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { onFakeClock, TEST_NOW } from "../../testing/factories/clock.factory";
import { useElapsed } from "./use-elapsed.hook";

describe("the time since a stream started", () => {
  it("reads 0:00 with no start", () => {
    expect(renderHook(() => useElapsed(null)).result.current).toBe("0:00");
  });

  it("shows minutes and seconds, then hours, ticking every second", () => {
    onFakeClock();
    const hook = renderHook(() => useElapsed(TEST_NOW - 59_000));
    expect(hook.result.current).toBe("0:59");
    act(() => vi.advanceTimersByTime(1000));
    expect(hook.result.current).toBe("1:00");
    act(() => vi.advanceTimersByTime(3600_000));
    expect(hook.result.current).toBe("1:01:00");
  });

  it("never counts below zero for a start a moment in the future", () => {
    onFakeClock();
    expect(renderHook(() => useElapsed(TEST_NOW + 5_000)).result.current).toBe("0:00");
  });
});

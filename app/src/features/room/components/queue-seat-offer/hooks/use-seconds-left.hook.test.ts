import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { onFakeClock } from "../../../../../testing/factories/clock.factory";
import { useSecondsLeft } from "./use-seconds-left.hook";

beforeEach(() => {
  onFakeClock();
});

describe("the seconds left on the offer", () => {
  it("count down each second, and stop at zero", () => {
    const { result } = renderHook(() => useSecondsLeft(5));
    expect(result.current).toBe(5);
    act(() => vi.advanceTimersByTime(2000));
    expect(result.current).toBe(3);
    act(() => vi.advanceTimersByTime(10_000));
    expect(result.current).toBe(0);
  });

  it("start over from the API's new count", () => {
    const { result, rerender } = renderHook(({ s }) => useSecondsLeft(s), { initialProps: { s: 60 } });
    act(() => vi.advanceTimersByTime(4000));
    rerender({ s: 30 });
    expect(result.current).toBe(30);
  });
});

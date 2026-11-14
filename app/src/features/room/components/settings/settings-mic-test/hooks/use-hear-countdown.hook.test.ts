import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HEAR_S, SECOND_MS } from "../constants/settings-mic-test.constants";
import { useHearCountdown } from "./use-hear-countdown.hook";

describe("Test's countdown", () => {
  it("counts the seconds down to none, each after the last one shows", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useHearCountdown());
    act(() => result.current.start());
    expect(result.current.left).toBe(HEAR_S);
    for (let s = HEAR_S - 1; s >= 0; s--) {
      act(() => vi.advanceTimersByTime(SECOND_MS));
      expect(result.current.left).toBe(s);
    }
  });

  it("stops at once", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useHearCountdown());
    act(() => result.current.start());
    act(() => result.current.stop());
    expect(result.current.left).toBe(0);
  });
});

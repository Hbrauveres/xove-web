import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { onFakeClock, TEST_NOW } from "../../../testing/factories/clock.factory";
import { useNow } from "./use-now.hook";

describe("the time now", () => {
  it("starts at now and moves only at each tick", () => {
    onFakeClock();
    const hook = renderHook(() => useNow(15_000));
    expect(hook.result.current).toBe(TEST_NOW);
    act(() => vi.advanceTimersByTime(14_999));
    expect(hook.result.current).toBe(TEST_NOW);
    act(() => vi.advanceTimersByTime(1));
    expect(hook.result.current).toBe(TEST_NOW + 15_000);
  });

  it("stops ticking once gone", () => {
    onFakeClock();
    const hook = renderHook(() => useNow(1000));
    hook.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { currentToast, resetToast, showToast, subscribeToast, TOAST_MS } from "./toast";

beforeEach(() => vi.useFakeTimers());
afterEach(() => resetToast());

describe("the toast's state", () => {
  it("shows one message at a time, the newest replacing it, gone after its time", () => {
    showToast("First");
    showToast("Second");
    expect(currentToast()?.text).toBe("Second");
    vi.advanceTimersByTime(TOAST_MS);
    expect(currentToast()).toBeNull();
  });

  it("resets to how the page started: no toast, no listener, the count from 1", () => {
    const listener = vi.fn();
    subscribeToast(listener);
    showToast("Left behind");
    resetToast();
    expect(currentToast()).toBeNull();
    showToast("Fresh");
    expect(currentToast()?.id).toBe(1);
    expect(listener).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(TOAST_MS);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { TOAST_MS } from "./constants/toast.constants";
import { ToastStore } from "./toast.store";

beforeEach(() => vi.useFakeTimers());

describe("the toast's state", () => {
  const store = new ToastStore();
  it("shows one message at a time, the newest replacing it, gone after its time", () => {
    store.show("First");
    store.show("Second");
    expect(store.current()?.text).toBe("Second");
    vi.advanceTimersByTime(TOAST_MS);
    expect(store.current()).toBeNull();
  });

  it("resets to how the page started: no toast, no listener, the count from 1", () => {
    const listener = vi.fn();
    store.subscribe(listener);
    store.show("Left behind");
    store.reset();
    expect(store.current()).toBeNull();
    store.show("Fresh");
    expect(store.current()?.id).toBe(1);
    expect(listener).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(TOAST_MS);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

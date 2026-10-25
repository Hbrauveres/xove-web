import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

/** The time every test on a fixed clock starts at, unless it says otherwise. */
export const TEST_NOW = new Date("2026-10-24T12:40:00");

/**
 * Fake timers on a fixed clock, set by the test that needs them, and a `userEvent` that moves those
 * timers along (a real one would hang on them). Delays then pass with `vi.advanceTimersByTime`.
 */
/** For a `userEvent` made before a test turns fake timers on: it moves them along only once they're on. */
export const moveFakeTimers = (ms: number) => {
  if (vi.isFakeTimers()) vi.advanceTimersByTime(ms);
};

export function onFakeClock(now: Date | number = TEST_NOW) {
  vi.useFakeTimers({ now });
  return userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
}

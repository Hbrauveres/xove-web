import { describe, expect, it, vi } from "vitest";
import { startFrameLoop } from "./frame-loop.util";

/** A fake clock, animation frames included, and the tab's visibility to set. */
function setup() {
  const tab = { hidden: false };
  vi.useFakeTimers({
    toFake: [
      "setTimeout",
      "setInterval",
      "clearInterval",
      "requestAnimationFrame",
      "cancelAnimationFrame",
      "performance",
    ],
  });
  vi.spyOn(document, "hidden", "get").mockImplementation(() => tab.hidden);
  return { tab, paint: vi.fn() };
}

describe("the light's frame loop", () => {
  it("paints about 60 times a second", () => {
    const { paint } = setup();
    const stop = startFrameLoop(paint, false);
    vi.advanceTimersByTime(1000);
    stop();
    expect(paint.mock.calls.length).toBeGreaterThanOrEqual(55);
    expect(paint.mock.calls.length).toBeLessThanOrEqual(63);
  });

  it("paints twice a second with reduced motion, the first at once", () => {
    const { paint } = setup();
    const stop = startFrameLoop(paint, true);
    expect(paint).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1000);
    stop();
    expect(paint).toHaveBeenCalledTimes(3);
  });

  it("pauses while the tab is hidden, and stops for good once stopped", () => {
    const { tab, paint } = setup();
    const stop = startFrameLoop(paint, false);
    tab.hidden = true;
    document.dispatchEvent(new Event("visibilitychange"));
    const before = paint.mock.calls.length;
    vi.advanceTimersByTime(1000);
    expect(paint.mock.calls.length - before).toBeLessThanOrEqual(1);
    tab.hidden = false;
    document.dispatchEvent(new Event("visibilitychange"));
    stop();
    const stopped = paint.mock.calls.length;
    vi.advanceTimersByTime(1000);
    expect(paint.mock.calls.length).toBe(stopped);
  });
});

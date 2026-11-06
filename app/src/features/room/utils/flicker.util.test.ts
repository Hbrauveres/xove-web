import { describe, expect, it, vi } from "vitest";
import { startFlicker } from "./flicker.util";

function setup() {
  const tab = { hidden: false };
  vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance"] });
  vi.spyOn(document, "hidden", "get").mockImplementation(() => tab.hidden);
  return { tab, draw: vi.fn() };
}

describe("a static's flicker", () => {
  it("draws about 15 times a second on a 60 Hz screen: every fourth frame, 50 ms apart", () => {
    const { draw } = setup();
    const stop = startFlicker(draw, false);
    vi.advanceTimersByTime(1000);
    stop();
    expect(draw.mock.calls.length).toBeGreaterThanOrEqual(14);
    expect(draw.mock.calls.length).toBeLessThanOrEqual(20);
  });

  it("skips while the tab is hidden, and stops once stopped", () => {
    const { tab, draw } = setup();
    const stop = startFlicker(draw, false);
    tab.hidden = true;
    vi.advanceTimersByTime(1000);
    expect(draw).not.toHaveBeenCalled();
    tab.hidden = false;
    stop();
    vi.advanceTimersByTime(1000);
    expect(draw).not.toHaveBeenCalled();
  });

  it("draws once, still, for reduced motion", () => {
    const { draw } = setup();
    const frames = vi.spyOn(window, "requestAnimationFrame");
    startFlicker(draw, true);
    vi.advanceTimersByTime(1000);
    expect(draw.mock.calls).toEqual([[0]]);
    expect(frames).not.toHaveBeenCalled();
  });
});

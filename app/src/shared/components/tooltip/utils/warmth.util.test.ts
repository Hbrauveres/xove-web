import { describe, expect, it, vi } from "vitest";
import { WARM_MS } from "../constants/tooltip.constants";
import { isWarm, resetTooltipWarmth, warmUp } from "./warmth.util";

describe("the next tooltip along a row", () => {
  it("shows at once for a moment after one hides, then waits again", () => {
    vi.useFakeTimers({ now: 0 });
    expect(isWarm()).toBe(false);
    warmUp();
    expect(isWarm()).toBe(true);
    vi.advanceTimersByTime(WARM_MS);
    expect(isWarm()).toBe(false);
    warmUp();
    resetTooltipWarmth();
    expect(isWarm()).toBe(false);
  });
});

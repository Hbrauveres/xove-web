import { describe, expect, it } from "vitest";
import { activityPillLabel } from "./activity-pill-label.util";

describe("the activity pill's name", () => {
  it("says what happened and when", () => {
    expect(activityPillLabel(false, { text: "Ana joined", ago: "now" }, 0)).toBe("Activity: Ana joined, now");
    expect(activityPillLabel(false, { text: "Ana joined", ago: "4 min" }, 0)).toBe("Activity: Ana joined, 4 min");
  });

  it("adds how many are new", () => {
    expect(activityPillLabel(false, { text: "Ana joined", ago: "now" }, 2)).toBe("Activity: Ana joined, now, 2 new");
  });

  it("says when nothing happened yet, or the connection dropped", () => {
    expect(activityPillLabel(false, null, 0)).toBe("Activity: nothing new yet");
    expect(activityPillLabel(true, { text: "Ana joined", ago: "now" }, 2)).toBe("Connection dropped. Reconnecting");
  });
});

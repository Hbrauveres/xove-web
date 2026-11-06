import { describe, expect, it } from "vitest";
import type { ActivityEvent } from "../../../types/room-view.types";
import { unseenCount } from "./unseen-count.util";

const events = ["a", "b", "c"].map((id): ActivityEvent => ({ id, kind: "joined", actorId: "x", at: 0 }));

describe("how many events are new", () => {
  it("counts the ones after the last seen", () => {
    expect(unseenCount(events, "a")).toBe(2);
    expect(unseenCount(events, "c")).toBe(0);
  });

  it("counts them all when none was seen, or the seen one is gone", () => {
    expect(unseenCount(events, null)).toBe(3);
    expect(unseenCount(events, "gone")).toBe(3);
  });
});

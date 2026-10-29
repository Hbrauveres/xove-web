import { describe, expect, it } from "vitest";
import { ACTIVITY_KEPT } from "../../constants/room.constants";
import { initialRoom } from "../../state/room.model";
import { withEvents } from "../../utils/activity-events.util";

describe("withEvents", () => {
  it("numbers the new events after the ones before", () => {
    const room = withEvents(initialRoom(), [{ at: 1, kind: "joined", actorId: "user-2" }]);
    const next = withEvents(room, [{ at: 2, kind: "left", actorId: "user-2" }]);
    expect(next.activity.map((e) => e.id)).toEqual(["room1", "room2"]);
  });

  it("keeps only the latest events, and the same room when there are none", () => {
    const room = initialRoom();
    expect(withEvents(room, [])).toBe(room);
    const many = Array.from({ length: ACTIVITY_KEPT + 1 }, (_, i) => ({
      at: i,
      kind: "joined" as const,
      actorId: "user-2" as const,
    }));
    expect(withEvents(room, many).activity).toHaveLength(ACTIVITY_KEPT);
  });
});

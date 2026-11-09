import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useActivityFeed } from "./use-activity-feed.hook";

describe("the activity", () => {
  it("puts the video room's joins and the room's own events in order", () => {
    const events = [{ id: "room1", at: 2000, kind: "started" as const, actorId: "user-2", stream: "screen" as const }];
    const presence = [{ id: 1, at: 1000, kind: "joined" as const, identity: "user-2" }];
    const hook = renderHook(() => useActivityFeed(events, presence));
    expect(hook.result.current.map((e) => [e.id, e.kind])).toEqual([
      ["lk1", "joined"],
      ["room1", "started"],
    ]);
  });

  it("gives the same list while nothing changes", () => {
    const events = [{ id: "room1", at: 2000, kind: "started" as const, actorId: "user-2", stream: "screen" as const }];
    const presence = [{ id: 1, at: 1000, kind: "joined" as const, identity: "user-2" }];
    const hook = renderHook(() => useActivityFeed(events, presence));
    const before = hook.result.current;
    hook.rerender();
    expect(hook.result.current).toBe(before);
  });
});

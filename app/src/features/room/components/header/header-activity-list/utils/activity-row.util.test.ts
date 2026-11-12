import { describe, expect, it } from "vitest";
import type { ActivityEvent } from "../../../../types/room-view.types";
import { activityRow } from "./activity-row.util";

const nameOf = () => "Bruno";
const started = (stream: "screen" | "camera"): ActivityEvent => ({
  id: "1",
  kind: "started",
  actorId: "b",
  at: 0,
  stream,
});
const live = () => true;

describe("an activity row", () => {
  it("is watchable when its stream is still live, and watched when it's on my stage", () => {
    expect(activityRow(started("camera"), { nameOf, meId: "me", isLive: live, watching: null })).toMatchObject({
      text: "Bruno turned on their camera",
      kind: "camera",
      isStream: true,
      watchable: true,
      watched: false,
    });
    expect(
      activityRow(started("screen"), { nameOf, meId: "me", isLive: live, watching: { personId: "b", kind: "screen" } })
        .watched,
    ).toBe(true);
    expect(
      activityRow(started("screen"), { nameOf, meId: "me", isLive: live, watching: { personId: "b", kind: "camera" } })
        .watched,
    ).toBe(false);
  });

  it("is text when the stream ended, or for people events", () => {
    expect(activityRow(started("screen"), { nameOf, meId: "me", isLive: () => false, watching: null }).watchable).toBe(
      false,
    );
    const joined: ActivityEvent = { id: "2", kind: "joined", actorId: "b", at: 0 };
    expect(activityRow(joined, { nameOf, meId: "me", isLive: live, watching: null })).toMatchObject({
      isStream: false,
      watchable: false,
    });
  });
});

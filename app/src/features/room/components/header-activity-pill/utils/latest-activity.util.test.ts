import { describe, expect, it } from "vitest";
import type { Friend } from "../../../types/room-view.types";
import { latestActivity } from "./latest-activity.util";

const ana: Friend = { id: "ana", name: "Ana", hue: 300, online: true };

describe("the latest activity", () => {
  it("is the newest event, with who did it and how long ago", () => {
    const events = [
      { id: "1", kind: "joined" as const, actorId: "gone", at: 0 },
      { id: "2", kind: "left" as const, actorId: "ana", at: 1000 },
    ];
    expect(latestActivity(events, [ana], "me", 241_000)).toEqual({
      id: "2",
      text: "Ana left",
      ago: "4 min",
      actor: ana,
    });
  });

  it("names someone no longer known as Someone, without a face", () => {
    const latest = latestActivity([{ id: "1", kind: "joined", actorId: "gone", at: 0 }], [ana], "me", 0);
    expect(latest).toMatchObject({ text: "Someone joined", actor: undefined });
  });

  it("is nothing before anything happened", () => {
    expect(latestActivity([], [ana], "me", 0)).toBeNull();
  });
});

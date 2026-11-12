import { describe, expect, it } from "vitest";
import type { LiveFeed, Sharer } from "../../../../types/room-view.types";
import { streamLabel, streamName } from "./stream-label.util";

const feed = (kind: "screen" | "camera"): LiveFeed => ({ kind, startedAt: 0, settings: {} as LiveFeed["settings"] });
const sharer = (isMe: boolean): Sharer => ({
  person: { id: "b", name: "Bruno", hue: 30, online: true },
  isMe,
  since: 0,
});

describe("what a stream is called", () => {
  it("is a camera or a shared screen", () => {
    expect(streamName(feed("camera"))).toBe("camera");
    expect(streamName(feed("screen"))).toBe("shared screen");
  });

  it("says whose it is", () => {
    expect(streamLabel(sharer(false), feed("screen"))).toBe("Bruno's shared screen");
    expect(streamLabel(sharer(true), feed("camera"))).toBe("Your camera");
  });
});

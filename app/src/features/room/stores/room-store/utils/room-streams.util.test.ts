import { describe, expect, it } from "vitest";
import { aLiveStream } from "../../../../../testing/factories/streams-state.factory";
import type { RoomStream } from "../../../types/room.types";
import { sameStreams, streamEvents, streamOf } from "./room-streams.util";

const aStream = (overrides: Partial<RoomStream> = {}): RoomStream => ({
  personId: "user-2",
  kind: "screen",
  since: 1000,
  settings: { quality: "1080p", mode: "smooth" },
  ...overrides,
});

describe("streamOf", () => {
  it("turns the API's stream into the room's", () => {
    const stream = aLiveStream({ userId: 3, kind: "camera", since: "2026-10-29T10:00:00Z" });
    expect(streamOf(stream)).toEqual({
      personId: "user-3",
      kind: "camera",
      since: Date.parse("2026-10-29T10:00:00Z"),
      settings: stream.settings,
    });
  });
});

describe("sameStreams", () => {
  it("is true for the same streams, since and settings", () => {
    expect(sameStreams([aStream()], [aStream()])).toBe(true);
  });

  it("is false when a setting changed, a stream came or went, or there was nothing before", () => {
    expect(sameStreams([aStream()], [aStream({ settings: { quality: "720p", mode: "smooth" } })])).toBe(false);
    expect(sameStreams([aStream()], [aStream(), aStream({ kind: "camera" })])).toBe(false);
    expect(sameStreams(null, [])).toBe(false);
  });
});

describe("streamEvents", () => {
  it("says what started and what stopped", () => {
    const events = streamEvents([aStream()], [aStream({ kind: "camera" })], 5000);
    expect(events).toEqual([
      { at: 5000, kind: "started", actorId: "user-2", stream: "camera" },
      { at: 5000, kind: "stopped", actorId: "user-2", stream: "screen" },
    ]);
  });

  it("says nothing on the first answer", () => {
    expect(streamEvents(null, [aStream()], 5000)).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";
import { START } from "../../../core/livekit/constants/livekit.constants";
import { aTrack, someMedia } from "../../../test/factories/remote-media.factory";
import type { RoomStream } from "../types/room.types";
import { feedOf } from "./feed.util";

const screen: RoomStream = {
  personId: "user-2",
  kind: "screen",
  since: 1000,
  settings: { quality: "1080p", mode: "smooth" },
};

describe("feedOf", () => {
  it("gives someone else's stream with its video from the server", () => {
    const remote = { video: aTrack(), setQuality: () => {} };
    const video = { ...START, remote: { "user-2": someMedia({ screen: remote }) } };
    expect(feedOf([screen], "screen", video, false)).toEqual({
      kind: "screen",
      startedAt: 1000,
      settings: screen.settings,
      remote,
    });
  });

  it("gives my stream with its video from this browser, and nothing for a stream that isn't live", () => {
    const local = aTrack();
    expect(feedOf([screen], "screen", { ...START, local: { screen: local } }, true)?.local).toBe(local);
    expect(feedOf([screen], "camera", START, false)).toBeUndefined();
  });
});

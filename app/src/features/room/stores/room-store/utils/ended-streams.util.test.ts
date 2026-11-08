import { describe, expect, it } from "vitest";
import type { RemoteMedia } from "@services/livekit-service";
import type { StreamsState } from "@services/xove-api-service";
import { aTrack } from "@testing/factories/remote-media.factory";
import { endedNow, sentVideos, withoutEnded } from "./ended-streams.util";

const video = { video: aTrack(), setQuality: () => {} };
const media = (kinds: Partial<RemoteMedia>) =>
  ({
    hasSound: false,
    hasVoice: false,
    speaking: false,
    setSoundOn: () => {},
    setVoiceOn: () => {},
    ...kinds,
  }) as RemoteMedia;
const listing = (...streams: [number, "screen" | "camera"][]) =>
  ({ streams: streams.map(([userId, kind]) => ({ userId, kind })) }) as unknown as StreamsState;

describe("streams that ended, as the video room saw it", () => {
  it("lists what others send now", () => {
    expect(sentVideos({ "user-2": media({ screen: video, camera: video }), "user-3": media({}) })).toEqual(
      new Set(["user-2:screen", "user-2:camera"]),
    );
  });

  it("ends what was sent and isn't any more, until it's sent again", () => {
    const ended = endedNow(new Set(), new Set(["user-2:screen", "user-3:camera"]), new Set(["user-3:camera"]));
    expect(ended).toEqual(new Set(["user-2:screen"]));
    expect(endedNow(ended, new Set(), new Set(["user-2:screen"]))).toEqual(new Set());
  });

  it("leaves an ended stream out of the API's answer while it still lists it, and forgets it after", () => {
    const ended = new Set(["user-2:screen"]);
    const first = withoutEnded(listing([2, "screen"], [3, "screen"]), ended);
    expect(first.answer.streams.map((s) => s.userId)).toEqual([3]);
    expect(first.ended).toEqual(ended);
    expect(withoutEnded(listing([3, "screen"]), ended).ended).toEqual(new Set());
  });
});

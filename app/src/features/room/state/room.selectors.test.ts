import { describe, expect, it } from "vitest";
import { START } from "@core/livekit/constants/livekit.constants";
import type { VideoRoomState } from "@core/livekit/types/livekit.types";
import { aLiveStream, anAnswer } from "../../../test/factories/streams-state.factory";
import { aTrack, someMedia } from "../../../test/factories/remote-media.factory";
import { hueOf } from "../utils/person-colour.util";
import { initialRoom, withMe, withStreams, withVideo } from "./room.model";
import { activityOf, knownPeopleOf, myLiveOf, peopleOf, sharersOf, watchingOf } from "./room.selectors";

const AT = Date.parse("2026-10-29T10:05:00Z");

/** Me (user-7) and Marina in the room; Marina shares her screen, and so do I. */
function room() {
  let model = withMe(initialRoom(), "user-7", "Henrique Brauveres");
  model = withVideo(model, [{ identity: "user-2", name: "Marina Souza" }], "connected", AT);
  model = withStreams(
    model,
    anAnswer({ streams: [aLiveStream(), aLiveStream({ userId: 7, name: "Henrique Brauveres", mine: true })] }),
    AT,
  );
  return model;
}

describe("what the room shows", () => {
  it("lists me first, in the colour everyone sees me in", () => {
    expect(peopleOf(room()).map((p) => [p.id, p.name, p.hue])).toEqual([
      ["user-7", "Henrique", hueOf("user-7")],
      ["user-2", "Marina", hueOf("user-2")],
    ]);
  });

  it("still names people who left, for the activity", () => {
    const left = withVideo(room(), [], "connected", AT);
    expect(peopleOf(left).map((p) => p.id)).toEqual(["user-7"]);
    expect(knownPeopleOf(left).map((p) => p.id)).toEqual(["user-7", "user-2"]);
  });

  it("knows which of my streams are live", () => {
    expect(myLiveOf(room())).toEqual({ screen: true, camera: false });
  });

  it("gives each sharer their streams with what the video room has: theirs from the server, mine from this browser", () => {
    const screen = { video: aTrack(), setQuality: () => {} };
    const mine = aTrack();
    const video: VideoRoomState = {
      ...START,
      remote: { "user-2": someMedia({ screen, hasVoice: true, speaking: true }) },
      local: { screen: mine },
    };
    const [marina, me] = sharersOf(room(), video);
    expect(marina).toMatchObject({ isMe: false, person: { id: "user-2" }, hasVoice: true, speaking: true });
    expect(marina?.screen?.remote).toBe(screen);
    expect(me).toMatchObject({ isMe: true, person: { id: "user-7" } });
    expect(me?.screen?.local).toBe(mine);
    expect(me?.speaking).toBeUndefined();
  });

  it("gives who watches what, and nothing from an older API", () => {
    expect(watchingOf(initialRoom())).toEqual({});
  });

  it("puts the activity in order, the video room's joins with the room's own events", () => {
    const joined = { id: "lk1", at: AT - 1000, kind: "joined" as const, actorId: "user-2" };
    const stopped = withStreams(room(), anAnswer({ streams: [] }), AT + 1000);
    expect(activityOf(stopped, [joined]).map((e) => e.kind)).toEqual(["joined", "stopped", "stopped"]);
  });
});

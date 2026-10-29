import { describe, expect, it } from "vitest";
import { aTrack, someMedia } from "../../../../test/factories/remote-media.factory";
import type { LocalMedia } from "../../types/livekit.types";
import { withLocal, withOthers, withPerson, withSpeakers } from "../../utils/room-state.util";

const room = () => {
  const marina = someMedia({ voice: aTrack(), hasVoice: true });
  const rafa = someMedia({ hasVoice: true, voice: aTrack() });
  return { marina, rafa, remote: { "user-2": marina, "user-3": rafa } };
};

describe("the room's state, person by person", () => {
  it("someone starting to talk changes only their talking state; everyone else stays the same object", () => {
    const { marina, rafa, remote } = room();

    const next = withSpeakers(remote, new Set(["user-2"]));

    expect(next["user-2"]).toEqual({ ...marina, speaking: true });
    expect(next["user-3"]).toBe(rafa);
    expect(withSpeakers(next, new Set(["user-2"]))).toBe(next);
  });

  it("never shows someone talking whose voice is off", () => {
    const quiet = someMedia({ hasVoice: false });
    expect(withSpeakers({ "user-4": quiet }, new Set(["user-4"]))["user-4"]).toBe(quiet);
  });

  it("someone's camera starting changes only their entry", () => {
    const { marina, rafa, remote } = room();
    const camera = { video: aTrack(), setQuality: () => {} };

    const next = withPerson(remote, "user-2", { ...marina, camera });

    expect(next["user-2"]?.camera).toBe(camera);
    expect(next["user-3"]).toBe(rafa);
  });

  it("an event that changes nothing keeps the whole record", () => {
    const { marina, remote } = room();
    expect(withPerson(remote, "user-2", { ...marina })).toBe(remote);
  });

  it("someone leaving takes only their entry out", () => {
    const { rafa, remote } = room();
    const next = withPerson(remote, "user-2", undefined);
    expect(next).toEqual({ "user-3": rafa });
    expect(withPerson(next, "user-2", undefined)).toBe(next);
  });

  it("someone joining changes the list of people; the same people keep the same list", () => {
    const before = [{ identity: "user-2", name: "Marina" }];
    const joined = [...before, { identity: "user-5", name: "Bruno" }];

    expect(withOthers(before, joined)).toBe(joined);
    expect(withOthers(joined, [...joined.map((p) => ({ ...p }))])).toBe(joined);
  });

  it("what I send keeps its object until something about it changes", () => {
    const mine: LocalMedia = {
      publishing: { screen: true, camera: false },
      local: {},
      screenSurface: undefined,
      cameraId: undefined,
      voice: false,
      localVoice: undefined,
      micInput: undefined,
    };
    expect(withLocal(mine, { ...mine, publishing: { ...mine.publishing } })).toBe(mine);
    const voiced = withLocal(mine, { ...mine, publishing: { ...mine.publishing }, voice: true });
    expect(voiced.voice).toBe(true);
    expect(voiced.publishing).toBe(mine.publishing);
  });
});

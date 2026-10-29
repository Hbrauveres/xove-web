import { describe, expect, it } from "vitest";
import { aLiveStream, anAnswer } from "../../../testing/factories/streams-state.factory";
import { myIdIn, watchesOf, withNames } from "./room-answer.util";

describe("withNames", () => {
  it("adds new names, and keeps the same record when nothing is new", () => {
    const names = { "user-2": "Marina" } as const;
    expect(withNames(names, [["user-2", "Marina"]])).toBe(names);
    expect(withNames(names, [["user-3", "Rafa"]])).toEqual({ "user-2": "Marina", "user-3": "Rafa" });
  });
});

describe("watchesOf", () => {
  it("gives who watches whom, by room id", () => {
    const answer = anAnswer({ watching: [{ userId: 3, sharerId: 2, kind: "screen", mine: false }] });
    expect(watchesOf(null, answer)).toEqual({ "user-3": { sharerId: "user-2", kind: "screen" } });
  });

  it("keeps the same record when nothing changed, and nothing from an older API", () => {
    const answer = anAnswer({ watching: [{ userId: 3, sharerId: 2, kind: "screen", mine: false }] });
    const before = watchesOf(null, answer);
    expect(watchesOf(before, answer)).toBe(before);
    expect(watchesOf(before, anAnswer())).toBeNull();
  });
});

describe("myIdIn", () => {
  it("finds my id in anything the API marks as mine", () => {
    expect(myIdIn(anAnswer({ streams: [aLiveStream({ userId: 7, mine: true })] }))).toBe("user-7");
  });

  it("is null when nothing is mine", () => {
    expect(myIdIn(anAnswer({ streams: [aLiveStream()] }))).toBeNull();
  });
});

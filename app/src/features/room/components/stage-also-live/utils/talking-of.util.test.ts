import { describe, expect, it } from "vitest";
import { aSharer } from "@testing/factories/sharer.factory";
import { talkingOf } from "./talking-of.util";

const heard = (voiceMuted = false) => ({ sound: { volume: 1, muted: false }, voice: { volume: 1, muted: voiceMuted } });
const speaking = () => aSharer({ hasVoice: true, speaking: true });

describe("talkingOf", () => {
  it("lights the picture while someone I hear speaks, the row closed", () => {
    expect(talkingOf(speaking(), heard(), false)).toBe(true);
  });

  it("not for a muted voice, an open row, or me", () => {
    expect(talkingOf(speaking(), heard(true), false)).toBe(false);
    expect(talkingOf(speaking(), heard(), true)).toBe(false);
    expect(talkingOf({ ...speaking(), isMe: true }, heard(), false)).toBe(false);
  });
});

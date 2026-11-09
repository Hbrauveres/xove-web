import { describe, expect, it } from "vitest";
import { aSharer } from "@testing/factories/sharer.factory";
import { talkingOf } from "./talking-of.util";

const heard = (voiceMuted = false) => ({ sound: { volume: 1, muted: false }, voice: { volume: 1, muted: voiceMuted } });
const speaking = () => aSharer({ hasVoice: true, speaking: true });

describe("talkingOf", () => {
  it("lights the picture while someone I hear speaks, the row closed", () => {
    expect(talkingOf(speaking(), heard(), false)).toBe(true);
  });

  it("not for a muted voice or an open row", () => {
    expect(talkingOf(speaking(), heard(true), false)).toBe(false);
    expect(talkingOf(speaking(), heard(), true)).toBe(false);
  });

  it("lights my own preview while my voice is sent, never from anyone else's speaking", () => {
    const me = { ...aSharer({ hasVoice: false }), isMe: true };
    expect(talkingOf(me, heard(), false, true)).toBe(true);
    expect(talkingOf(me, heard(), false, false)).toBe(false);
    expect(talkingOf(me, heard(), true, true)).toBe(false);
    expect(talkingOf({ ...speaking(), isMe: true }, heard(), false, false)).toBe(false);
    // Someone else's preview doesn't light from my speaking.
    expect(talkingOf(aSharer({ hasVoice: true, speaking: false }), heard(), false, true)).toBe(false);
  });
});

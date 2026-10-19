import { describe, expect, it } from "vitest";
import { choose, hearingOf } from "./hearing";

const defaults = { sound: 0.8, voice: 0.6 };

describe("hearing a person (spec 0131, FR-1)", () => {
  it("hears someone untouched while they're on the stage, at my last volumes", () => {
    expect(hearingOf(undefined, true, defaults)).toEqual({
      sound: { volume: 0.8, muted: false },
      voice: { volume: 0.6, muted: false },
    });
  });

  it("doesn't hear someone untouched while they're small", () => {
    expect(hearingOf(undefined, false, defaults)).toEqual({
      sound: { volume: 0.8, muted: true },
      voice: { volume: 0.6, muted: true },
    });
  });

  it("keeps a touched switch wherever the person is, and leaves the other one untouched", () => {
    // Small, I turn their voice on: it stays on when they're big, and their sound still follows the rule.
    const was = hearingOf(undefined, false, defaults);
    const mine = choose(undefined, was, { ...was, voice: { volume: 0.6, muted: false } });
    expect(hearingOf(mine, false, defaults)).toEqual({
      sound: { volume: 0.8, muted: true },
      voice: { volume: 0.6, muted: false },
    });
    expect(hearingOf(mine, true, defaults).sound.muted).toBe(false);
    // Big, I mute them: they stay muted when small too.
    const muted = choose(mine, hearingOf(mine, true, defaults), {
      ...hearingOf(mine, true, defaults),
      voice: { volume: 0.6, muted: true },
    });
    expect(hearingOf(muted, true, defaults).voice.muted).toBe(true);
    expect(hearingOf(muted, false, defaults).voice.muted).toBe(true);
  });

  it("keeps each person's own volume", () => {
    const was = hearingOf(undefined, true, defaults);
    const mine = choose(undefined, was, { ...was, sound: { volume: 0.3, muted: false } });
    expect(hearingOf(mine, false, defaults).sound.volume).toBe(0.3);
    expect(hearingOf(mine, false, defaults).voice.volume).toBe(0.6);
  });
});

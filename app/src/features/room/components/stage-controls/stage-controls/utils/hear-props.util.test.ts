import { describe, expect, it, vi } from "vitest";
import { aSharer } from "../../../../../../testing/factories/sharer.factory";
import { hearProps } from "./hear-props.util";

const hear = { sound: { volume: 0.6, muted: false }, voice: { volume: 0.4, muted: true } };

describe("what I hear from the person on the stage", () => {
  it("is my volume and mute for their screen's sound and their voice, and changes each alone", () => {
    const setHear = vi.fn();
    const { sound, voice } = hearProps(
      aSharer({ hasSound: true, hasVoice: true, speaking: true }),
      () => hear,
      setHear,
    );
    expect(sound).toMatchObject({ volume: 0.6, muted: false });
    expect(voice).toMatchObject({ volume: 0.4, muted: true, name: "Bruno", talking: true });
    expect(sound.unavailable).toBeUndefined();
    sound.onChange({ volume: 0.2, muted: false });
    expect(setHear).toHaveBeenLastCalledWith("user-7", { ...hear, sound: { volume: 0.2, muted: false } });
  });

  it("says why a sound can't be heard", () => {
    expect(hearProps(aSharer({ kinds: ["camera"] }), () => hear, vi.fn()).sound.unavailable).toBe("No screen sound");
    expect(hearProps(aSharer({ hasSound: false }), () => hear, vi.fn()).sound.unavailable).toBe(
      "No sound in this stream",
    );
    expect(hearProps(aSharer({ hasVoice: false }), () => hear, vi.fn()).voice.unavailable).toBe("Bruno's mic is off");
  });
});

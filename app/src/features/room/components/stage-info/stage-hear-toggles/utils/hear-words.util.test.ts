import { describe, expect, it } from "vitest";
import { aSharer } from "@testing/factories/sharer.factory";
import { hearWords } from "./hear-words.util";

describe("hearWords", () => {
  it("names a sound and what a click does", () => {
    const bruno = aSharer({ hasSound: true, hasVoice: true });
    expect(hearWords(bruno, "voice", false)).toEqual({
      what: "Bruno's voice",
      unavailable: undefined,
      label: "Mute Bruno's voice",
    });
    expect(hearWords(bruno, "sound", true).label).toBe("Unmute Bruno's screen sound");
  });

  it("says why a sound can't be heard", () => {
    const quiet = aSharer({ kinds: ["camera"], hasSound: false, hasVoice: false });
    expect(hearWords(quiet, "sound", false).label).toBe("Bruno: No screen sound");
    expect(hearWords(quiet, "voice", false).label).toBe("Bruno: Bruno's mic is off");
  });
});

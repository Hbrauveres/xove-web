import { describe, expect, it } from "vitest";
import { moreSections } from "./more-sections.util";

describe("what '…' shows", () => {
  it("Go live's rows and the sounds, a line between, the settings opening from it", () => {
    expect(moreSections(["go-live", "sound", "voice"])).toEqual({
      settings: false,
      goLive: true,
      sound: true,
      voice: true,
      line: true,
      holdsSettings: true,
    });
  });

  it("only the sounds while I'm live: no line, the settings not from it", () => {
    const s = moreSections(["sound", "voice"]);
    expect(s.line).toBe(false);
    expect(s.holdsSettings).toBe(false);
  });

  it("the settings alone with nobody live, opening from it", () => {
    expect(moreSections(["settings"])).toMatchObject({ settings: true, holdsSettings: true, line: false });
  });
});

import { expect, it } from "vitest";
import { voiceCue } from "./voice-cue.util";

it("cues only a voice I hear: lit while they speak, faded while quiet", () => {
  expect(voiceCue("voice", false, true)).toBe("talking");
  expect(voiceCue("voice", false, false)).toBe("silent");
  expect(voiceCue("voice", true, true)).toBeUndefined();
  expect(voiceCue("sound", false, true)).toBeUndefined();
});

import { expect, it } from "vitest";
import { soundIcon } from "./sound-icon.util";

it("crosses a sound out while it's off", () => {
  expect([soundIcon("sound", false), soundIcon("sound", true)]).toEqual(["sound", "volume-off"]);
  expect([soundIcon("voice", false), soundIcon("voice", true)]).toEqual(["voice", "voice-off"]);
});

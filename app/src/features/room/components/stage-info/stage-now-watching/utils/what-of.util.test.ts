import { expect, it } from "vitest";
import { aSharer } from "@testing/factories/sharer.factory";
import { whatOf } from "./what-of.util";

it("says what a person shares in two words, and their voice when it's on, never mine", () => {
  expect(whatOf(aSharer({ kinds: ["screen", "camera"] }))).toBe("Screen with camera");
  expect(whatOf(aSharer({ kinds: ["camera"], hasVoice: true }))).toBe("Camera · voice");
  expect(whatOf(aSharer({ kinds: ["screen"], hasVoice: true, isMe: true }))).toBe("Screen");
});

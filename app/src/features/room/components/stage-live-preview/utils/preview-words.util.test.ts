import { describe, expect, it } from "vitest";
import { aSharer } from "@testing/factories/sharer.factory";
import { previewWords } from "./preview-words.util";

describe("previewWords", () => {
  it("names someone's screen", () => {
    const s = aSharer({ name: "Ana" });
    expect(s.screen && previewWords(s, s.screen)).toEqual({
      label: "Watch Ana's screen",
      picture: "Ana's shared screen",
      pill: "Ana · screen",
    });
  });

  it("names my own camera", () => {
    const s = aSharer({ kinds: ["camera"], isMe: true });
    expect(s.camera && previewWords(s, s.camera)).toEqual({
      label: "Watch your camera",
      picture: "Your camera",
      pill: "You · camera",
    });
  });
});

import { describe, expect, it } from "vitest";
import { aSharer } from "@testing/factories/sharer.factory";
import { previewWords } from "./preview-words.util";

describe("previewWords", () => {
  it("names someone's screen", () => {
    const s = aSharer({ name: "Ana" });
    expect(s.screen && previewWords(s, s.screen)).toEqual({
      label: "Watch Ana · screen",
      picture: "Ana's shared screen",
      pill: "Ana · screen",
    });
  });

  it("names my own camera", () => {
    const s = aSharer({ kinds: ["camera"], isMe: true });
    expect(s.camera && previewWords(s, s.camera)).toEqual({
      label: "Watch You · camera",
      picture: "Your camera",
      pill: "You · camera",
    });
  });
});

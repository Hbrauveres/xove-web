import { describe, expect, it } from "vitest";
import { aSharer } from "@testing/factories/sharer.factory";
import { stackOf } from "./stack.util";

describe("stackOf", () => {
  it("puts the screen in front and the camera behind, for someone sharing both", () => {
    const s = aSharer({ kinds: ["screen", "camera"] });
    const stack = stackOf(s, false);
    expect(stack.both).toBe(true);
    expect(stack.feed).toBe(s.screen);
    expect(stack.back).toBe(s.camera);
  });

  it("swapped, puts the camera in front", () => {
    const s = aSharer({ kinds: ["screen", "camera"] });
    expect(stackOf(s, true).feed).toBe(s.camera);
  });

  it("with one picture, shows it alone", () => {
    const s = aSharer({ kinds: ["camera"] });
    expect(stackOf(s, true)).toMatchObject({ both: false, feed: s.camera, back: undefined });
  });
});

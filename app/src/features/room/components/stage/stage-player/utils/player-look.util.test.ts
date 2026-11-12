import { describe, expect, it } from "vitest";
import { chromeState, lightKey } from "./player-look.util";

describe("the player's look", () => {
  it("fades the controls only over a playing video", () => {
    expect(chromeState(false, false)).toBeUndefined();
    expect(chromeState(true, true)).toBe("shown");
    expect(chromeState(true, false)).toBe("hidden");
  });

  it("names the light by the person, the stream and the grid", () => {
    expect(lightKey(null, null, 16 / 9)).toBe("none");
    expect(lightKey("user-7", "screen", 16 / 9)).toBe("user-7|screen|64x36");
    expect(lightKey("user-7", "screen", 9 / 16)).not.toBe(lightKey("user-7", "screen", 16 / 9));
  });
});

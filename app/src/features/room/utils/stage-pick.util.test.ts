import { describe, expect, it } from "vitest";
import { aSharer } from "../../../test/factories/sharer.factory";
import { isPlaying, mainKindOf, stagePick } from "./stage-pick.util";

describe("who is big", () => {
  it("nobody when nobody shares", () => {
    expect(stagePick([], null)).toBeNull();
    expect(stagePick([], "user-7")).toBeNull();
  });

  it("the person sharing the longest, by default", () => {
    expect(stagePick(["user-7", "user-9"], null)).toBe("user-7");
  });

  it("the person the viewer picked, while they share", () => {
    expect(stagePick(["user-7", "user-9"], "user-9")).toBe("user-9");
  });

  it("the longest sharing again when the picked person stops", () => {
    expect(stagePick(["user-7", "user-3"], "user-9")).toBe("user-7");
  });

  it("the longest remaining when the big one stops", () => {
    expect(stagePick(["user-3", "user-9"], null)).toBe("user-3");
  });
});

describe("what of theirs is big", () => {
  it("their only stream, or with both the screen unless I swapped them", () => {
    const both = aSharer({ kinds: ["screen", "camera"] });
    expect(mainKindOf(both, false)).toBe("screen");
    expect(mainKindOf(both, true)).toBe("camera");
    expect(mainKindOf(aSharer({ kinds: ["camera"] }), false)).toBe("camera");
    expect(mainKindOf(null, false)).toBeNull();
  });

  it("plays once its video arrives", () => {
    const sharer = aSharer();
    expect(isPlaying(sharer, "screen")).toBe(true);
    const { remote: _arrived, ...stillLoading } = sharer.screen!;
    const loading = { ...sharer, screen: stillLoading };
    expect(isPlaying(loading, "screen")).toBe(false);
  });
});

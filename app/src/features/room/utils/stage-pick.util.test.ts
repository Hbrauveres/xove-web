import { describe, expect, it } from "vitest";
import { aSharer } from "../../../test/factories/sharer.factory";
import { holds, isPlaying, mainKindOf, stagePick, streamsOf } from "./stage-pick.util";

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

describe("a pick", () => {
  it("holds while one of the streams live when it was made still is", () => {
    const both = aSharer({ id: "user-7", kinds: ["screen", "camera"] });
    const pick = { personId: "user-7", streams: streamsOf(both) };
    const { screen: _gone, ...cameraOnly } = both;
    expect(holds(pick, [cameraOnly])).toBe(true);
  });

  it("lapses once that person stops, even if they share again later", () => {
    const pick = { personId: "user-7", streams: [1000] };
    const again = aSharer({ id: "user-7" });
    again.screen!.startedAt = 5000;
    expect(holds(pick, [])).toBe(false);
    expect(holds(pick, [again])).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { aStagePick } from "../../../../../testing/factories/room-session.factory";
import { aSharer } from "../../../../../testing/factories/sharer.factory";
import { liveIn, onMyStage, sharingOf } from "./sharing.util";

describe("who shares what", () => {
  it("lists each sharer's screen and camera by their id", () => {
    const sharers = [aSharer({ id: "bruno", kinds: ["screen"] }), aSharer({ id: "ana", kinds: ["camera", "screen"] })];
    expect(sharingOf(sharers)).toEqual({ bruno: { screen: true, camera: false }, ana: { screen: true, camera: true } });
  });

  it("says a stream is live only for who shares that kind", () => {
    const isLive = liveIn({ bruno: { screen: true, camera: false } });
    expect(isLive("bruno", "screen")).toBe(true);
    expect(isLive("bruno", "camera")).toBe(false);
    expect(isLive("nobody", "screen")).toBe(false);
  });

  it("says what's on my stage once someone's stream is on it", () => {
    const bruno = aSharer({ id: "bruno" });
    expect(onMyStage(aStagePick({ big: bruno, mainKind: "camera" }))).toEqual({ personId: "bruno", kind: "camera" });
    expect(onMyStage(aStagePick())).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import { NO_SCREEN, NO_SOUND } from "../../../constants/stream-words.constants";
import { streamState } from "./stream-state.util";

const given = (over = {}) => ({
  mine: { screen: false, camera: false },
  places: 6,
  free: 6,
  canShareScreen: true,
  ...over,
});

describe("streamState", () => {
  it("offers to start, or to stop what's live", () => {
    expect(streamState("screen", given())).toMatchObject({ live: false, blocked: false, tip: "Share your screen" });
    expect(streamState("camera", given({ mine: { screen: false, camera: true } }))).toMatchObject({
      live: true,
      tip: "Turn off your camera",
    });
  });

  it("greys a start in a full room, or a screen where the browser can't share one, saying why", () => {
    expect(streamState("camera", given({ free: 0, places: 4 })).tip).toMatch(/^4 streams are live/);
    expect(streamState("screen", given({ canShareScreen: false }))).toMatchObject({
      unavailable: true,
      tip: NO_SCREEN,
    });
  });

  it("keeps a live stream usable when the room is full, and waits while busy", () => {
    expect(streamState("screen", given({ mine: { screen: true, camera: false }, free: 0 })).unavailable).toBe(false);
    expect(streamState("screen", given({ busy: true }))).toMatchObject({ unavailable: false, blocked: true });
  });

  it("says when my shared screen has no sound", () => {
    expect(streamState("screen", given({ mine: { screen: true, camera: false }, noSound: true })).tip).toBe(
      `Stop sharing your screen. ${NO_SOUND}`,
    );
  });
});

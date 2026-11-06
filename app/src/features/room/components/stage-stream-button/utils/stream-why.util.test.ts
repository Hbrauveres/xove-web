import { describe, expect, it } from "vitest";
import { NO_SCREEN } from "../../../constants/stream-words.constants";
import { streamWhy } from "./stream-why.util";

const given = (over = {}) => ({
  mine: { screen: false, camera: false },
  places: 6,
  free: 6,
  canShareScreen: true,
  ...over,
});

describe("streamWhy", () => {
  it("says why a stream can't start", () => {
    expect(streamWhy("screen", given({ canShareScreen: false }))).toBe(NO_SCREEN);
    expect(streamWhy("camera", given({ free: 0, places: 4 }))).toMatch(/^4 streams are live/);
  });

  it("says nothing while it can, or while it's live", () => {
    expect(streamWhy("camera", given())).toBeUndefined();
    expect(streamWhy("camera", given({ free: 0, mine: { screen: false, camera: true } }))).toBeUndefined();
  });
});

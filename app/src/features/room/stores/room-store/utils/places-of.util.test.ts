import { describe, expect, it } from "vitest";
import { aLiveStream, anAnswer } from "@testing/factories/streams-state.factory";
import { placesOf } from "./places-of.util";

describe("placesOf", () => {
  it("takes the app's setting first", () => {
    expect(placesOf(4, anAnswer({ places: 6, free: 6 }))).toBe(4);
  });

  it("without the setting, takes what the API's answer says", () => {
    expect(placesOf(null, anAnswer({ places: 4, free: 3, streams: [aLiveStream()] }))).toBe(4);
  });

  it("from an older API, counts the free places and the live streams", () => {
    const answer = anAnswer({ free: 2, streams: [aLiveStream(), aLiveStream({ kind: "camera" })] });
    expect(placesOf(null, answer)).toBe(4);
  });
});

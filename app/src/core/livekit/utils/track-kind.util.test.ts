import { describe, expect, it } from "vitest";
import { FakeLocalCameraTrack, FakeLocalMicTrack } from "../../../test/fakeLiveKit";
import { isLocalAudio, isLocalVideo } from "./track-kind.util";

describe("a track's kind", () => {
  it("tells a camera from a mic, and anything else from both", () => {
    expect([isLocalVideo(new FakeLocalCameraTrack()), isLocalAudio(new FakeLocalCameraTrack())]).toEqual([true, false]);
    expect([isLocalVideo(new FakeLocalMicTrack()), isLocalAudio(new FakeLocalMicTrack())]).toEqual([false, true]);
    expect([isLocalVideo(undefined), isLocalAudio({ kind: "audio" })]).toEqual([false, false]);
  });
});

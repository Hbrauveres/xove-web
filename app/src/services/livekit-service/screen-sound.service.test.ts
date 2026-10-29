import { describe, expect, it } from "vitest";
import { FakeMediaStreamTrack } from "../../testing/fakeLiveKit";
import { screenSound } from "./screen-sound.service";

describe("the screen's sound", () => {
  it("wraps a screen's sound as the screen's audio", () => {
    const audio = screenSound(new FakeMediaStreamTrack() as unknown as MediaStreamTrack);
    expect(audio.source).toBe("screen_share_audio");
  });
});

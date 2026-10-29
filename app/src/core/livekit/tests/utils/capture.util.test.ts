import { describe, expect, it } from "vitest";
import { FakeMediaStreamTrack } from "../../../../test/fakeLiveKit";
import { isDomError, screenSound, startFailed } from "../../utils/capture.util";

describe("capturing helpers", () => {
  it("tells a browser's refusal by its name", () => {
    expect(isDomError(new DOMException("no", "NotAllowedError"), "NotAllowedError")).toBe(true);
    expect(isDomError(new Error("no"), "NotAllowedError")).toBe(false);
  });

  it("says what failed to start", () => {
    expect([startFailed("screen"), startFailed("camera")]).toEqual([
      "Couldn't start sharing your screen.",
      "Couldn't turn on your camera.",
    ]);
  });

  it("wraps a screen's sound as the screen's audio", () => {
    const audio = screenSound(new FakeMediaStreamTrack() as unknown as MediaStreamTrack);
    expect(audio.source).toBe("screen_share_audio");
  });
});

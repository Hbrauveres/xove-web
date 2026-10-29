import { describe, expect, it, vi } from "vitest";
import { canShareScreen, screenCaptureRequest } from "./screen-picker.util";

describe("the screen picker's request", () => {
  it("always captures the best quality at 30 fps, and never this tab", () => {
    const request = screenCaptureRequest(false);
    expect(request.video).toEqual({ width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: 30 });
    // Safari needs a ceiling instead, as LiveKit asks it.
    expect(screenCaptureRequest(true).video).toEqual({ width: { max: 1920 }, height: { max: 1080 }, frameRate: 30 });
    expect(request.selfBrowserSurface).toBe("exclude");
  });

  it("captures the sound as played: no voice filters, stereo, without Xovê's own sound", () => {
    expect(screenCaptureRequest(false).audio).toEqual({
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
      channelCount: 2,
      restrictOwnAudio: true,
    });
  });

  it("takes a picked window's own sound, not the whole system's", () => {
    expect(screenCaptureRequest(false).windowAudio).toBe("window");
  });
});

describe("sharing a screen at all", () => {
  it("is possible only where the browser has a screen picker", () => {
    vi.stubGlobal("navigator", { ...navigator, mediaDevices: { getDisplayMedia: () => {} } });
    expect(canShareScreen()).toBe(true);
    vi.stubGlobal("navigator", { ...navigator, mediaDevices: undefined });
    expect(canShareScreen()).toBe(false);
  });
});

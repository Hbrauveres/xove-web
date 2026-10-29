import { describe, expect, it, vi } from "vitest";
import { canShareScreen, newCaptureController, pickScreen, screenCaptureRequest } from "../../utils/screen-picker.util";

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

describe("staying on Xovê after the picker", () => {
  it("has no controller where the browser has none", () => {
    expect(newCaptureController()).toBeUndefined();
  });

  it("asks the browser to stay on Xovê once a screen is picked", async () => {
    const setFocusBehavior = vi.fn();
    vi.stubGlobal(
      "CaptureController",
      class {
        setFocusBehavior = setFocusBehavior;
      },
    );
    vi.stubGlobal("MediaStream", class {});
    const stream = new MediaStream();
    const getDisplayMedia = vi.fn(async () => stream);
    vi.stubGlobal("navigator", { ...navigator, mediaDevices: { getDisplayMedia } });

    await expect(pickScreen()).resolves.toBe(stream);
    expect(setFocusBehavior).toHaveBeenCalledWith("no-focus-change");
    expect(canShareScreen()).toBe(true);
  });

  it("still gives the screen when the browser can't stay on Xovê (a whole screen has no window)", async () => {
    vi.stubGlobal(
      "CaptureController",
      class {
        setFocusBehavior() {
          throw new DOMException("Not a tab or window", "InvalidStateError");
        }
      },
    );
    vi.stubGlobal("MediaStream", class {});
    const stream = new MediaStream();
    vi.stubGlobal("navigator", { ...navigator, mediaDevices: { getDisplayMedia: vi.fn(async () => stream) } });

    await expect(pickScreen()).resolves.toBe(stream);
  });
});

import { describe, expect, it, vi } from "vitest";
import { newCaptureController, pickScreen } from "./screen-picker.service";
import { screenCaptureRequest } from "./utils/screen-picker.util";

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
    // The best quality, the sound as played, never this tab: the request the picker is asked with.
    expect(getDisplayMedia).toHaveBeenCalledWith(expect.objectContaining(screenCaptureRequest()));
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

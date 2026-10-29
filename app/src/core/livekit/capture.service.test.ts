import { describe, expect, it, vi } from "vitest";
import { lastRoom } from "../../test/fakeLiveKit";
import { connectedAdapter, shareScreen } from "../../test/factories/video-room.factory";
import type { LiveKitAdapter } from "./livekit.adapter";
import type { Capture } from "./livekit.types";

const change = (adapter: LiveKitAdapter) => adapter.changeScreen({ quality: "720p", mode: "sharp" });

describe("a capture before it's sent", () => {
  it("shows its preview and says when the browser ends it, without handing out its tracks", async () => {
    const adapter = await connectedAdapter();
    const capture = (await adapter.capture("camera", "smooth", "cam-2"))! as Capture;
    const ended = vi.fn();
    capture.onEnded(ended);

    expect(capture.preview).toBeDefined();
    expect(capture.hasSound).toBe(false);
    expect(lastRoom().localParticipant.createTracks).toHaveBeenLastCalledWith(
      expect.objectContaining({ video: expect.objectContaining({ deviceId: { ideal: "cam-2" } }) }),
    );
    expect(Object.keys(capture)).toEqual(["kind", "preview", "hasSound", "onEnded"]);
  });
});

/** This test's own CaptureController: the focus behaviours the app asked of it, in order. */
function captureController() {
  const behaviours: string[] = [];
  class FakeCaptureController {
    setFocusBehavior(behaviour: string) {
      behaviours.push(behaviour);
    }
  }
  vi.stubGlobal("CaptureController", FakeCaptureController);
  return { behaviours, FakeCaptureController };
}

describe("staying on Xovê after the picker", () => {
  it("asks the browser to stay on Xovê when a screen is picked, and when it's changed", async () => {
    const { behaviours, FakeCaptureController } = captureController();
    const adapter = await connectedAdapter();
    const local = await shareScreen(adapter, true);

    expect(local.getDisplayMedia).toHaveBeenLastCalledWith(
      expect.objectContaining({ controller: expect.any(FakeCaptureController), windowAudio: "window" }),
    );
    expect(behaviours).toEqual(["no-focus-change"]);

    await change(adapter);
    expect(behaviours).toEqual(["no-focus-change", "no-focus-change"]);
  });

  it("still shares when the browser refuses (a whole screen can't keep the focus)", async () => {
    vi.stubGlobal(
      "CaptureController",
      class {
        setFocusBehavior() {
          throw new DOMException("Not a tab or window", "InvalidStateError");
        }
      },
    );
    const adapter = await connectedAdapter();
    const local = await shareScreen(adapter, true);

    expect(local.screens).toHaveLength(1);
    expect(adapter.getState().error).toBeNull();
  });
});

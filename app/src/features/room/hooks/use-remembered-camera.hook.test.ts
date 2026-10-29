import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { cameraOn, connectedAdapter } from "../../../testing/factories/video-room.factory";
import { lastRoom } from "../../../testing/fakeLiveKit";
import { useRememberedCamera } from "./use-remembered-camera.hook";
import { CAMERA_DEVICE_KEY } from "../../../services/preferences-service/constants/preferences.constants";

async function withAdapter() {
  const adapter = await connectedAdapter();
  const hook = renderHook(() => useRememberedCamera(adapter));
  return { adapter, hook };
}

describe("the camera picked", () => {
  it("remembers a camera switched to, and asks for it next time", async () => {
    const { adapter, hook } = await withAdapter();
    await cameraOn(adapter);

    await act(async () => {
      await hook.result.current.pickCamera("cam-2", { quality: "720p", mode: "sharp" });
    });
    expect(localStorage.getItem(CAMERA_DEVICE_KEY)).toBe("cam-2");
    expect(hook.result.current.savedCamera).toBe("cam-2");

    await act(async () => {
      await adapter.stop("camera");
    });
    await act(async () => {
      const capture = await hook.result.current.capture("camera", "smooth");
      await adapter.publishCapture(capture!, { quality: "720p", mode: "smooth" });
    });
    expect(lastRoom().localParticipant.createTracks).toHaveBeenLastCalledWith(
      expect.objectContaining({ video: expect.objectContaining({ deviceId: { ideal: "cam-2" } }) }),
    );
  });

  it("doesn't remember a camera that failed", async () => {
    const { adapter, hook } = await withAdapter();
    await cameraOn(adapter);
    lastRoom().localParticipant.camera!.track.restartTrack.mockRejectedValueOnce(
      new DOMException("in use", "NotReadableError"),
    );

    await act(async () => {
      await hook.result.current.pickCamera("cam-2", { quality: "720p", mode: "smooth" });
    });

    expect(localStorage.getItem(CAMERA_DEVICE_KEY)).toBeNull();
    expect(hook.result.current.savedCamera).toBeNull();
  });

  it("remembers a camera picked while none is sent", async () => {
    const { hook } = await withAdapter();
    await act(async () => {
      await hook.result.current.pickCamera("cam-2", { quality: "720p", mode: "smooth" });
    });
    expect(localStorage.getItem(CAMERA_DEVICE_KEY)).toBe("cam-2");
    expect(hook.result.current.savedCamera).toBe("cam-2");
  });
});

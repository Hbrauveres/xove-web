import { act, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FakeLocalCameraTrack, lastRoom } from "../../testing/fakeLiveKit";
import { cameraOn, connectedAdapter } from "../../testing/factories/video-room.factory";

describe("pick a camera", () => {
  it("switches the camera being sent without stopping it", async () => {
    const adapter = await connectedAdapter();
    const camera = (await cameraOn(adapter)) as FakeLocalCameraTrack;

    await act(async () => {
      await adapter.pickCamera("cam-2", { quality: "720p", mode: "sharp" });
    });

    expect(camera.restartTrack).toHaveBeenCalledWith(expect.objectContaining({ deviceId: { exact: "cam-2" } }));
    // The new browser track keeps the stream's mode.
    expect(camera.mediaStreamTrack.contentHint).toBe("detail");
    expect(lastRoom().localParticipant.camera?.track).toBe(camera);
    expect(lastRoom().localParticipant.unpublishTrack).not.toHaveBeenCalled();
    expect(adapter.getState().cameraId).toBe("cam-2");
  });

  it("goes back to the previous camera when the new one fails", async () => {
    const adapter = await connectedAdapter();
    const camera = (await cameraOn(adapter)) as FakeLocalCameraTrack;
    camera.restartTrack.mockRejectedValueOnce(new DOMException("Device in use", "NotReadableError"));

    await act(async () => {
      await adapter.pickCamera("cam-2", { quality: "720p", mode: "smooth" });
    });

    expect(camera.restartTrack).toHaveBeenLastCalledWith(expect.objectContaining({ deviceId: { exact: "cam-1" } }));
    expect(lastRoom().localParticipant.camera?.track).toBe(camera);
    expect(adapter.getState().error).toBe("Couldn't switch to that camera.");
    expect(adapter.getState().cameraId).toBe("cam-1");
  });

  it("stops the camera when neither the new one nor the old one comes back", async () => {
    const adapter = await connectedAdapter();
    const camera = (await cameraOn(adapter)) as FakeLocalCameraTrack;
    camera.restartTrack.mockRejectedValue(new DOMException("Device in use", "NotReadableError"));

    await act(async () => {
      await adapter.pickCamera("cam-2", { quality: "720p", mode: "smooth" });
    });

    expect(lastRoom().localParticipant.camera).toBeNull();
  });

  it("still stops the camera when a switched camera is unplugged", async () => {
    const adapter = await connectedAdapter();
    const camera = (await cameraOn(adapter)) as FakeLocalCameraTrack;
    await act(async () => {
      await adapter.pickCamera("cam-2", { quality: "720p", mode: "sharp" });
    });

    await act(async () => {
      camera.mediaStreamTrack.end();
    });

    await waitFor(() => expect(lastRoom().localParticipant.camera).toBeNull());
  });
});

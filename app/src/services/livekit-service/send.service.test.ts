import { act, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FakeLocalCameraTrack, FakeLocalScreenTrack, lastRoom } from "../../testing/fakeLiveKit";
import { cameraOn, connectedAdapter } from "../../testing/factories/video-room.factory";
import { cameraPublishOptions, capOf, screenPublishOptions } from "./utils/publish-options.util";

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

describe("sending my screen and camera", () => {
  /** Captures my screen (with its sound) and sends it with these settings. */
  async function sendScreen(quality: "1080p" | "720p" | "480p", mode: "smooth" | "sharp") {
    const adapter = await connectedAdapter();
    lastRoom().localParticipant.nextPickerAudio = true;
    const capture = await adapter.capture("screen", mode);
    const started = capture ? await adapter.publishCapture(capture, { quality, mode }) : null;
    return { adapter, started, local: lastRoom().localParticipant };
  }

  it("sends the screen and its sound with the mode's options, marked for motion, capped at the quality", async () => {
    const { local } = await sendScreen("720p", "smooth");
    const [video, sound] = local.lastCapture;
    expect(local.publishTrack).toHaveBeenCalledWith(video, {
      ...screenPublishOptions("smooth"),
      source: "screen_share",
    });
    expect(local.publishTrack).toHaveBeenCalledWith(sound, {
      ...screenPublishOptions("smooth"),
      source: "screen_share_audio",
    });
    expect(video?.mediaStreamTrack.contentHint).toBe("motion");
    expect((video as FakeLocalScreenTrack).setPublishingQuality).toHaveBeenLastCalledWith(capOf("720p"));
  });

  it("sends Sharp marked for detail, capped at its quality", async () => {
    const { local } = await sendScreen("480p", "sharp");
    const video = local.lastCapture[0] as FakeLocalScreenTrack;
    expect(video.mediaStreamTrack.contentHint).toBe("detail");
    expect(video.setPublishingQuality).toHaveBeenLastCalledWith(capOf("480p"));
  });

  it("sends my camera with the camera's options, capped at its quality", async () => {
    const adapter = await connectedAdapter();
    const capture = await adapter.capture("camera", "smooth");
    if (capture) await adapter.publishCapture(capture, { quality: "720p", mode: "smooth" });
    const local = lastRoom().localParticipant;
    const camera = local.lastCamera;
    expect(local.publishTrack).toHaveBeenCalledWith(camera, { ...cameraPublishOptions("smooth"), source: "camera" });
    expect(camera?.setPublishingQuality).toHaveBeenLastCalledWith(capOf("720p"));
  });

  it("stops and says so when the sent screen can't be identified", async () => {
    const adapter = await connectedAdapter();
    lastRoom().localParticipant.screenTrackSid = undefined;
    const capture = await adapter.capture("screen", "smooth");
    const started = capture ? await adapter.publishCapture(capture, { quality: "1080p", mode: "smooth" }) : "none";
    expect(started).toBeNull();
    expect(lastRoom().localParticipant.isScreenShareEnabled).toBe(false);
    expect(adapter.getState().error).toBe("Couldn't start sharing your screen.");
  });

  it("changes a live screen to Sharp: marked for detail, keeping its sharpness, capped at the quality", async () => {
    const { adapter, local } = await sendScreen("1080p", "smooth");
    const video = local.screens[0]?.track;
    await act(async () => adapter.applySettings("screen", { quality: "720p", mode: "sharp" }));
    expect(video?.mediaStreamTrack.contentHint).toBe("detail");
    expect(video?.setDegradationPreference).toHaveBeenLastCalledWith("maintain-resolution");
    expect(video?.setPublishingQuality).toHaveBeenLastCalledWith(capOf("720p"));
  });

  it("stops my screen with its sound: nothing left sent, every track stopped", async () => {
    const { adapter, local } = await sendScreen("1080p", "smooth");
    await act(async () => adapter.stop("screen"));
    expect(local.screens).toHaveLength(0);
    expect(local.screenAudio).toBeNull();
    expect(local.lastCapture.every((t) => t.stopped)).toBe(true);
  });
});

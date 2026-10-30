import { describe, expect, it, vi } from "vitest";
import { lastRoom } from "../../testing/fakeLiveKit";
import { connectedAdapter } from "../../testing/factories/video-room.factory";
import { CAMERA_BLOCKED, CAMERA_MISSING } from "@services/media-devices-service";
import type { Capture } from "./types/livekit.types";

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

describe("capturing my screen or camera", () => {
  it("unlocks the page's sound when a screen comes with its sound", async () => {
    const adapter = await connectedAdapter();
    lastRoom().localParticipant.nextPickerAudio = true;
    const capture = await adapter.capture("screen", "smooth");
    expect(capture?.hasSound).toBe(true);
    expect(lastRoom().startAudio).toHaveBeenCalled();
  });

  it("gives nothing, and no error, when the picker is closed without choosing", async () => {
    const adapter = await connectedAdapter();
    lastRoom().localParticipant.nextPicker = "cancel";
    expect(await adapter.capture("screen", "smooth")).toBeNull();
    expect(adapter.getState().error).toBeNull();
  });

  it("says the screen couldn't start when the browser gives no screen, or its picker fails", async () => {
    const adapter = await connectedAdapter();
    lastRoom().localParticipant.nextPicker = "no-video";
    expect(await adapter.capture("screen", "smooth")).toBeNull();
    expect(adapter.getState().error).toBe("Couldn't start sharing your screen.");
    lastRoom().localParticipant.getDisplayMedia.mockImplementationOnce(async () => {
      throw new TypeError("getDisplayMedia is not supported here");
    });
    expect(await adapter.capture("screen", "smooth")).toBeNull();
    expect(adapter.getState().error).toBe("Couldn't start sharing your screen.");
  });

  it("says how to allow a camera the browser blocked", async () => {
    const adapter = await connectedAdapter();
    lastRoom().localParticipant.nextCamera = "NotAllowedError";
    expect(await adapter.capture("camera", "smooth")).toBeNull();
    expect(adapter.getState()).toMatchObject({ error: CAMERA_BLOCKED, cameraProblem: "blocked" });
  });

  it("says when there's no camera", async () => {
    const adapter = await connectedAdapter();
    lastRoom().localParticipant.nextCamera = "NotFoundError";
    expect(await adapter.capture("camera", "smooth")).toBeNull();
    expect(adapter.getState()).toMatchObject({ error: CAMERA_MISSING, cameraProblem: "missing" });
  });
});

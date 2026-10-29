import { describe, expect, it, vi } from "vitest";
import { FakeLocalScreenTrack, FakeMediaStreamTrack, lastRoom } from "../../test/fakeLiveKit";
import { connectedAdapter, shareScreen } from "../../test/factories/video-room.factory";
import type { LiveKitAdapter } from "./livekit.adapter";
import { capOf } from "./publish-options.util";

const change = (adapter: LiveKitAdapter) => adapter.changeScreen({ quality: "720p", mode: "sharp" });

describe("change window", () => {
  it("swaps the new pick into the same published screen, with the sharer's settings", async () => {
    const adapter = await connectedAdapter();
    const local = await shareScreen(adapter, true);
    const published = local.screens[0]!;
    const video = published.track as FakeLocalScreenTrack;
    const before = video.mediaStreamTrack;

    expect(await change(adapter)).toEqual({ hasSound: true });

    // Same publication and track id: the API and viewers see the same stream.
    expect(local.screens).toEqual([published]);
    expect(published.trackSid).toBe("TR_my_screen");
    expect(video.replaceTrack).toHaveBeenCalledWith(expect.any(FakeMediaStreamTrack), { userProvidedTrack: false });
    expect(before.stopped).toBe(true);
    expect(video.mediaStreamTrack).not.toBe(before);
    expect(video.mediaStreamTrack.contentHint).toBe("detail");
    expect(video.setPublishingQuality).toHaveBeenLastCalledWith(capOf("720p"));
    expect(local.unpublishTrack).not.toHaveBeenCalled();
  });

  it("swaps the sound too when both have it", async () => {
    const adapter = await connectedAdapter();
    const local = await shareScreen(adapter, true);
    const sound = local.screenAudio!.track;

    await change(adapter);

    expect(sound.replaceTrack).toHaveBeenCalledWith(expect.any(FakeMediaStreamTrack), { userProvidedTrack: false });
    expect(local.screenAudio?.track).toBe(sound);
  });

  it("adds the sound when the new pick has it and the old one didn't", async () => {
    const adapter = await connectedAdapter();
    const local = await shareScreen(adapter, false);
    expect(local.screenAudio).toBeNull();
    local.nextPickerAudio = true;

    expect(await change(adapter)).toEqual({ hasSound: true });

    expect(local.screenAudio?.track.source).toBe("screen_share_audio");
    expect(local.publishTrack).toHaveBeenLastCalledWith(
      local.screenAudio?.track,
      expect.objectContaining({ source: "screen_share_audio" }),
    );
    expect(lastRoom().localParticipant.screens).toHaveLength(1);
  });

  it("drops the sound when the new pick has none, keeping the screen", async () => {
    const adapter = await connectedAdapter();
    const local = await shareScreen(adapter, true);
    const sound = local.screenAudio!.track;
    local.nextPickerAudio = false;

    expect(await change(adapter)).toEqual({ hasSound: false });

    expect(local.unpublishTrack).toHaveBeenCalledWith(sound, true);
    expect(local.screenAudio).toBeNull();
    expect(local.screens).toHaveLength(1);
  });

  it("stops the new pick when the share ended while the picker was open", async () => {
    const adapter = await connectedAdapter();
    const local = await shareScreen(adapter, true);
    const video = local.screens[0]!.track as FakeLocalScreenTrack;
    // The browser's own "Stop sharing" bar, used while the picker is open.
    local.duringPicker = () => lastRoom().browserStopsMyShare();

    expect(await change(adapter)).toBeNull();

    expect(video.replaceTrack).not.toHaveBeenCalled();
    expect(local.lastPicked.length).toBeGreaterThan(0);
    expect(local.lastPicked.every((t) => t.stopped)).toBe(true);
  });

  it("stops the new pick when the swap fails", async () => {
    const adapter = await connectedAdapter();
    const local = await shareScreen(adapter, true);
    const video = local.screens[0]!.track as FakeLocalScreenTrack;
    video.replaceTrack.mockRejectedValueOnce(new Error("unable to replace an unpublished track"));

    expect(await change(adapter)).toBeNull();

    expect(local.lastPicked.every((t) => t.stopped)).toBe(true);
    expect(adapter.getState().error).toBe("Couldn't change what you share.");
  });

  it("keeps the current share when the picker is closed", async () => {
    const adapter = await connectedAdapter();
    const local = await shareScreen(adapter, true);
    const video = local.screens[0]!.track as FakeLocalScreenTrack;
    local.nextPicker = "cancel";

    expect(await change(adapter)).toBeNull();

    expect(video.replaceTrack).not.toHaveBeenCalled();
    expect(video.stopped).toBe(false);
    expect(adapter.getState().error).toBeNull();
  });
});

describe("staying on Xovê after the picker", () => {
  it("asks the browser to stay on Xovê when the screen is changed too", async () => {
    const behaviours: string[] = [];
    vi.stubGlobal(
      "CaptureController",
      class {
        setFocusBehavior(behaviour: string) {
          behaviours.push(behaviour);
        }
      },
    );
    const adapter = await connectedAdapter();
    await shareScreen(adapter, true);

    await change(adapter);

    expect(behaviours).toEqual(["no-focus-change", "no-focus-change"]);
  });
});

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Capture } from "@core/livekit/types/livekit.types";
import { aUser, installFakeApi } from "../../../../test/fakeApi";
import { aTrack } from "../../../../test/factories/track.factory";
import { RoomStore } from "../../state/room.store";
import { SettingsQueue } from "../../utils/settings-queue.util";
import { useMyStreams } from "../../hooks/use-my-streams.hook";

const PREFS = { screen: { quality: "1080p", mode: "smooth" }, camera: { quality: "720p", mode: "smooth" } } as const;
const aCapture = (kind: "screen" | "camera"): Capture => ({
  kind,
  preview: aTrack(),
  hasSound: false,
  onEnded: () => () => {},
});

/** The hook over a fresh store and fake API; the video sends what it's given, with or without sound. */
function myStreams({ picked = true, hasSound = true } = {}) {
  const server = installFakeApi({ me: aUser({ status: "MEMBER" }) });
  const store = new RoomStore("Henrique", 60_000);
  const video = {
    publishCapture: vi.fn(async () => ({ participantSid: "PA_me", trackSid: "TR_1", hasSound })),
    stop: vi.fn(async () => {}),
  };
  const capture = vi.fn(async (kind: "screen" | "camera") => (picked ? aCapture(kind) : null));
  const takePreview = vi.fn((): Capture | null => null);
  const queue = new SettingsQueue(PREFS);
  const hook = renderHook(() =>
    useMyStreams({ store, video, capture, prefs: PREFS, queue, takePreview, mine: store.getState().model.mine }),
  );
  return { hook, server, store, video, capture, takePreview, queue };
}

describe("my screen and camera", () => {
  it("starts with one click: picked, sent, told to the API, and live", async () => {
    const { hook, server, store, queue } = myStreams();
    await act(async () => hook.result.current.start("screen"));
    expect(server.calls.some((c) => c.method === "POST" && c.path === "/api/streams")).toBe(true);
    expect(store.getState().model.mine.screen).toBe("live");
    expect(queue.acceptedFor("screen")).toEqual(PREFS.screen);
  });

  it("goes back to off when the picker is closed", async () => {
    const { hook, store, video } = myStreams({ picked: false });
    await act(async () => hook.result.current.start("screen"));
    expect(video.publishCapture).not.toHaveBeenCalled();
    expect(store.getState().model.mine.screen).toBe("off");
  });

  it("sends the camera's preview as is, instead of asking for the camera again", async () => {
    const { hook, capture, takePreview, video } = myStreams();
    const preview = aCapture("camera");
    takePreview.mockReturnValueOnce(preview);
    await act(async () => hook.result.current.start("camera"));
    expect(capture).not.toHaveBeenCalled();
    expect(video.publishCapture).toHaveBeenCalledWith(preview, PREFS.camera);
  });

  it("stops: the video, then the API, and off", async () => {
    const { hook, store, video, server } = myStreams();
    await act(async () => hook.result.current.start("screen"));
    await act(async () => hook.result.current.stop("screen"));
    expect(video.stop).toHaveBeenCalledWith("screen");
    expect(server.calls.some((c) => c.path === "/api/streams/screen/stop")).toBe(true);
    expect(store.getState().model.mine.screen).toBe("off");
  });

  it("says when my screen goes out without sound", async () => {
    const { hook } = myStreams({ hasSound: false });
    await act(async () => hook.result.current.start("screen"));
    expect(hook.result.current.noSound).toBe(true);
  });

  it("gives the same value while nothing changes", () => {
    const { hook } = myStreams();
    const before = hook.result.current;
    hook.rerender();
    expect(hook.result.current).toBe(before);
  });

  it("stops the video when the API refuses the stream", async () => {
    const { hook, server, video, store } = myStreams();
    server.failures.set("POST /api/streams", {
      status: 409,
      body: { detail: "The 6 places are taken.", reason: "full" },
    });
    await act(async () => hook.result.current.start("screen"));
    expect(video.stop).toHaveBeenCalledWith("screen");
    expect(store.getState().model.mine.screen).toBe("off");
  });

  it("goes back to off when the video couldn't be sent", async () => {
    const { hook, video, store, server } = myStreams();
    video.publishCapture.mockResolvedValueOnce(null as never);
    await act(async () => hook.result.current.start("camera"));
    expect(store.getState().model.mine.camera).toBe("off");
    expect(server.calls.some((c) => c.method === "POST" && c.path === "/api/streams")).toBe(false);
  });
});

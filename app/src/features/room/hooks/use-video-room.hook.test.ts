import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { aUser, installFakeApi } from "../../../test/fakeApi";
import { lastRoom } from "../../../test/fakeLiveKit";
import { useVideoRoom } from "./use-video-room.hook";

const member = () => aUser({ name: "Henrique Brauveres", status: "MEMBER" });

async function connected() {
  installFakeApi({ me: member() });
  const hook = renderHook(() => useVideoRoom());
  await waitFor(() => expect(hook.result.current.connection).toBe("connected"));
  return hook;
}

async function cameraOn(hook: Awaited<ReturnType<typeof connected>>) {
  await act(async () => {
    const capture = await hook.result.current.capture("camera", "smooth");
    await hook.result.current.publishCapture(capture!, { quality: "720p", mode: "smooth" });
  });
}

describe("the room's video server", () => {
  it("joins with the access the API gives", async () => {
    await connected();
    expect(lastRoom().connectedWith?.token).toBeTruthy();
  });

  it("says the API's reason when it gives no access", async () => {
    const server = installFakeApi({ me: member() });
    server.failures.set("POST /api/livekit/token", { status: 403, body: { detail: "You need a seat first." } });
    const hook = renderHook(() => useVideoRoom());

    await waitFor(() => expect(hook.result.current.connection).toBe("disconnected"));
    expect(hook.result.current.error).toBe("You need a seat first.");
  });

  it("gives the same value while nothing changes", async () => {
    const hook = await connected();
    const before = hook.result.current;
    hook.rerender();
    expect(hook.result.current).toBe(before);
  });

  it("leaves the room when the page closes", async () => {
    const hook = await connected();
    hook.unmount();
    expect(lastRoom().disconnected).toBe(true);
  });
});

describe("the page's sound", () => {
  it("unlocks it on the first click or key", async () => {
    await connected();
    const room = lastRoom();
    room.startAudio.mockClear();
    document.dispatchEvent(new Event("pointerup"));
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
    expect(room.startAudio).toHaveBeenCalledTimes(2);
  });
});

describe("the camera picked", () => {
  it("lists the browser's cameras and the one being sent", async () => {
    const hook = await connected();
    await cameraOn(hook);

    await waitFor(() =>
      expect(hook.result.current.cameras).toEqual([
        { deviceId: "cam-1", label: "Logitech C920" },
        { deviceId: "cam-2", label: "Integrated Webcam" },
      ]),
    );
    expect(hook.result.current.cameraId).toBe("cam-1");
  });
});

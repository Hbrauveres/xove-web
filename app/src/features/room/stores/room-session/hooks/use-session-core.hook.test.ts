import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { aUser, installFakeApi, someoneSharing } from "../../../../../testing/fakeApi";
import { useRememberedCamera } from "./use-remembered-camera.hook";
import { useRoomStore } from "../../room-store";
import { useSessionCore } from "./use-session-core.hook";

const DEVICES = { cameras: [{ deviceId: "cam-1", label: "Logitech C920" }], mics: [] };

/** The core over a real room store, on the fake API and LiveKit. */
function renderCore() {
  return renderHook(() => {
    const room = useRoomStore("Henrique Brauveres", 50);
    const camera = useRememberedCamera(room.store.video);
    return useSessionCore(room, DEVICES, camera);
  });
}

describe("the room's core", () => {
  it("gathers who's live, my places and my devices", async () => {
    const server = installFakeApi({ me: aUser({ name: "Henrique Brauveres", status: "MEMBER" }) });
    server.streams = [someoneSharing("Bruno")];
    const hook = renderCore();
    await waitFor(() => expect(hook.result.current.sharers.map((s) => s.person.name)).toEqual(["Bruno"]));
    expect(hook.result.current.free).toBe(hook.result.current.places - 1);
    expect(hook.result.current.cameras).toBe(DEVICES.cameras);
    expect(hook.result.current.error).toBeNull();
    hook.unmount();
  });

  it("gives the same value while nothing changes", async () => {
    installFakeApi({ me: aUser({ name: "Henrique Brauveres", status: "MEMBER" }) });
    const hook = renderCore();
    await waitFor(() => expect(hook.result.current.video.connection).toBe("connected"));
    const before = hook.result.current;
    hook.rerender();
    expect(hook.result.current).toBe(before);
    hook.unmount();
  });
});

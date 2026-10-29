import { renderHook, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import { describe, expect, it } from "vitest";
import { aUser, installFakeApi, MY_USER_ID } from "../../../../test/fakeApi";
import { lastRoom, rooms } from "../../../../test/fakeLiveKit";
import { useRoomStore } from "../../hooks/use-room-store.hook";

const member = () => aUser({ name: "Henrique Brauveres", status: "MEMBER" });

describe("the room's store on the page", () => {
  it("gets a seat, names me and joins the video room, once even when React mounts the page twice", async () => {
    installFakeApi({ me: member() });
    const hook = renderHook(() => useRoomStore("Henrique Brauveres", 50), { wrapper: StrictMode });

    await waitFor(() => expect(hook.result.current.video.connection).toBe("connected"));

    expect(hook.result.current.model.me).toBe(`user-${MY_USER_ID}`);
    expect(hook.result.current.seat.status).toEqual({ status: "in" });
    expect(rooms.filter((r) => !r.disconnected)).toHaveLength(1);
    hook.unmount();
  });

  it("gives the same value while nothing changes", async () => {
    installFakeApi({ me: member() });
    const hook = renderHook(() => useRoomStore("Henrique Brauveres", 60_000));
    await waitFor(() => expect(hook.result.current.video.connection).toBe("connected"));

    const before = hook.result.current;
    hook.rerender();
    expect(hook.result.current).toBe(before);
    hook.unmount();
  });

  it("leaves the video room when the page closes", async () => {
    installFakeApi({ me: member() });
    const hook = renderHook(() => useRoomStore("Henrique Brauveres", 50));
    await waitFor(() => expect(hook.result.current.video.connection).toBe("connected"));

    hook.unmount();

    expect(lastRoom().disconnected).toBe(true);
  });
});

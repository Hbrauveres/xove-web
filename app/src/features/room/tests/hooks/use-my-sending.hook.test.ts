import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { aUser, installFakeApi } from "../../../../test/fakeApi";
import { lastRoom } from "../../../../test/fakeLiveKit";
import { useMySending } from "../../hooks/use-my-sending.hook";
import { useRoomStore } from "../../hooks/use-room-store.hook";

const NOT_LIVE = { screen: false, camera: false };

/** What I send, over the page's own store, in a room I've joined. */
async function sending() {
  const server = installFakeApi({ me: aUser({ name: "Henrique Brauveres", status: "MEMBER" }) });
  const hook = renderHook(() => {
    const room = useRoomStore("Henrique Brauveres", 60_000);
    return { room, sending: useMySending(room, NOT_LIVE) };
  });
  await waitFor(() => expect(hook.result.current.room.video.connection).toBe("connected"));
  return { server, hook };
}

describe("what I send, put together", () => {
  it("starts my screen with my remembered settings, at the video and the API", async () => {
    const { server, hook } = await sending();
    await act(async () => hook.result.current.sending.start("screen"));
    await waitFor(() => expect(lastRoom().localParticipant.screens).toHaveLength(1));
    expect(server.calls.some((c) => c.method === "POST" && c.path === "/api/streams")).toBe(true);
  });

  it("gives the same value while nothing changes", async () => {
    const { hook } = await sending();
    const before = hook.result.current.sending;
    hook.rerender();
    expect(hook.result.current.sending).toBe(before);
  });
});

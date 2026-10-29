import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { aUser, installFakeApi, MY_USER_ID } from "../../../test/fakeApi";
import { aLiveStream, anAnswer } from "../../../test/factories/streams-state.factory";
import { withMe, withMyStep, withStreams } from "../state/room.model";
import { RoomStore } from "../state/room.store";
import { SettingsQueue } from "../utils/settings-queue.util";
import { useStreamSync } from "./use-stream-sync.hook";

const PREFS = { screen: { quality: "1080p", mode: "smooth" }, camera: { quality: "720p", mode: "smooth" } } as const;
const ME = `user-${MY_USER_ID}`;

/** The hook over a store whose model says what the API lists; `publishing` is what this browser sends. */
function sync(listed: boolean, publishing: boolean) {
  const server = installFakeApi({ me: aUser({ status: "MEMBER" }) });
  const store = new RoomStore("Henrique", 60_000);
  const streams = listed ? [aLiveStream({ userId: MY_USER_ID, mine: true })] : [];
  store.change((m) => withStreams(withMe(m, ME, "Henrique"), anAnswer({ streams }), Date.now(), true));
  const stopSending = vi.fn(async () => {});
  const hook = renderHook(() =>
    useStreamSync({
      store,
      model: store.getState().model,
      live: { screen: listed, camera: false },
      publishing: { screen: publishing, camera: false },
      connection: "connected",
      connectionOf: () => ({ participantSid: "PA_me", trackSid: "TR_1" }),
      stopSending,
      queue: new SettingsQueue(PREFS),
    }),
  );
  return { hook, server, store, stopSending };
}

describe("my streams and the API in step", () => {
  it("registers again a stream the API lost while I still send it", async () => {
    const { server } = sync(false, true);
    await waitFor(() =>
      expect(server.calls.filter((c) => c.method === "POST" && c.path === "/api/streams")).toHaveLength(1),
    );
  });

  it("ends a stream the API lists but nothing sends", async () => {
    const { server } = sync(true, false);
    await waitFor(() => expect(server.calls.some((c) => c.path === "/api/streams/screen/stop")).toBe(true));
  });

  it("sets a stream that ended outside Stop back to off", () => {
    const server = installFakeApi({ me: aUser({ status: "MEMBER" }) });
    const store = new RoomStore("Henrique", 60_000);
    store.change((m) =>
      withMyStep(withMyStep(withMyStep(m, "screen", "picking"), "screen", "starting"), "screen", "live"),
    );
    renderHook(() =>
      useStreamSync({
        store,
        model: store.getState().model,
        live: { screen: false, camera: false },
        publishing: { screen: false, camera: false },
        connection: "connected",
        connectionOf: () => null,
        stopSending: vi.fn(),
        queue: new SettingsQueue(PREFS),
      }),
    );
    expect(store.getState().model.mine.screen).toBe("off");
    expect(server.calls).toEqual([]);
  });
});

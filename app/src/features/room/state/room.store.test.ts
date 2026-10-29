import { afterEach, describe, expect, it, vi } from "vitest";
import { aUser, installFakeApi, MY_USER_ID } from "../../../test/fakeApi";
import { lastRoom } from "../../../test/fakeLiveKit";
import { RoomStore } from "./room.store";

const POLL = 2000;

/** A fresh store over a fresh fake API, opened; fake timers drive its polls. */
function openStore(seat: { status: "in" } | { status: "waiting"; place: number } = { status: "in" }) {
  vi.useFakeTimers();
  const server = installFakeApi({ me: aUser({ name: "Henrique Brauveres", status: "MEMBER" }) });
  server.seat = seat;
  const store = new RoomStore("Henrique Brauveres", POLL);
  store.open();
  return { server, store };
}

const calls = (server: ReturnType<typeof installFakeApi>, key: string) =>
  server.calls.filter((c) => `${c.method} ${c.path}` === key).length;

const settle = () => vi.advanceTimersByTimeAsync(0);

afterEach(() => {
  vi.useRealTimers();
});

describe("the room's store: my seat", () => {
  it("asks for a seat every interval while waiting, and stops once in", async () => {
    const { server, store } = openStore({ status: "waiting", place: 2 });
    await settle();
    await vi.advanceTimersByTimeAsync(POLL * 2);
    expect(calls(server, "POST /api/room/enter")).toBe(3);
    expect(store.getState().model.seat).toEqual({ status: "waiting", place: 2 });

    server.seat = { status: "in" };
    await vi.advanceTimersByTimeAsync(POLL);
    const asked = calls(server, "POST /api/room/enter");
    await vi.advanceTimersByTimeAsync(POLL * 3);
    expect(calls(server, "POST /api/room/enter")).toBe(asked);
    store.close();
  });

  it("leaves the queue on Cancel, even with a poll on its way, and joins again after", async () => {
    const { server, store } = openStore({ status: "waiting", place: 2 });
    await settle();
    await vi.advanceTimersByTimeAsync(POLL);
    await store.cancel();
    await vi.advanceTimersByTimeAsync(POLL * 2);
    expect(store.getState().model.seat).toEqual({ status: "left" });
    expect(calls(server, "POST /api/room/cancel")).toBe(1);

    store.rejoin();
    await settle();
    expect(store.getState().model.seat).toEqual({ status: "waiting", place: 2 });
    store.close();
  });

  it("tells the API when the waiting page closes, so the place is kept", async () => {
    const { server, store } = openStore({ status: "waiting", place: 1 });
    await settle();
    window.dispatchEvent(new Event("pagehide"));
    await settle();
    expect(calls(server, "POST /api/room/leave")).toBe(1);
    store.close();
  });
});

describe("the room's store: in the room", () => {
  it("names me from the video access, joins the video room with it, and polls the streams", async () => {
    const { server, store } = openStore();
    await settle();
    await settle();
    expect(store.getState().model.me).toBe(`user-${MY_USER_ID}`);
    expect(store.getState().model.names[`user-${MY_USER_ID}`]).toBe("Henrique");
    expect(lastRoom().connectedWith?.token).toBe("test-token");

    await vi.advanceTimersByTimeAsync(POLL * 2);
    expect(calls(server, "GET /api/streams")).toBe(3);
    store.close();
  });

  it("stops every poll and leaves the video room when closed", async () => {
    const { server, store } = openStore();
    await settle();
    store.close();
    const asked = server.calls.length;
    await vi.advanceTimersByTimeAsync(POLL * 3);
    expect(server.calls.length).toBe(asked);
    expect(lastRoom().disconnected).toBe(true);
  });

  it("enters again with my video connection when the API forgot my seat, until it knows again", async () => {
    const { server, store } = openStore();
    await settle();
    server.seated = false;
    await vi.advanceTimersByTimeAsync(POLL);
    await settle();
    const enters = server.calls.filter((c) => c.path === "/api/room/enter");
    expect(enters.at(-1)?.body).toEqual({ participantSid: "PA_me" });
    expect(server.seated).toBe(true);

    await vi.advanceTimersByTimeAsync(POLL * 2);
    const after = calls(server, "POST /api/room/enter");
    await vi.advanceTimersByTimeAsync(POLL * 2);
    expect(calls(server, "POST /api/room/enter")).toBe(after);
    store.close();
  });
});

describe("the room's store: my streams at the API", () => {
  it("starts, changes and stops a stream, and drops a poll answer that was already on its way", async () => {
    const { server, store } = openStore();
    await settle();
    const connection = { participantSid: "PA_me", trackSid: "TR_my_screen" };

    expect(await store.startStream("screen", connection, { quality: "1080p", mode: "smooth" })).toBe("ok");
    expect(store.getState().model.streams?.map((s) => s.kind)).toEqual(["screen"]);
    expect(await store.changeStreamSettings("screen", { quality: "720p", mode: "sharp" })).toBe(true);
    expect(await store.stopStream("screen")).toBe(true);
    expect(store.getState().model.streams).toEqual([]);
    expect(server.calls.map((c) => c.path)).toEqual(
      expect.arrayContaining(["/api/streams", "/api/streams/screen/settings", "/api/streams/screen/stop"]),
    );
    store.close();
  });

  it("says why a start failed, and whether the places are full", async () => {
    const { server, store } = openStore();
    await settle();
    server.failures.set("POST /api/streams", {
      status: 409,
      body: { detail: "The 6 places are taken.", reason: "full" },
    });

    expect(
      await store.startStream(
        "camera",
        { participantSid: "PA_me", trackSid: "TR" },
        { quality: "720p", mode: "smooth" },
      ),
    ).toBe("full");
    expect(store.getState().model).toMatchObject({ streamsError: "The 6 places are taken.", streamsBusy: false });
    store.close();
  });

  it("reports what's on my stage", async () => {
    const { server, store } = openStore();
    await settle();
    await store.reportWatching({ sharerId: 2, kind: "screen" });
    expect(server.myWatch).toEqual({ sharerId: 2, kind: "screen" });
    store.close();
  });
});

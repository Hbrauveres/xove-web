import { afterEach, describe, expect, it, vi } from "vitest";
import { aUser, installFakeApi, MY_USER_ID } from "../../../../testing/fakeApi";
import { lastRoom } from "../../../../testing/fakeLiveKit";
import { RoomStore } from "./room.store";
import { POLL_MS } from "../../constants/room.constants";

/** A fresh store over a fresh fake API, opened; fake timers drive its polls. */
function openStore(seat: { status: "in" } | { status: "waiting"; place: number } = { status: "in" }) {
  vi.useFakeTimers();
  const server = installFakeApi({ me: aUser({ name: "Henrique Brauveres", status: "MEMBER" }) });
  server.seat = seat;
  const store = new RoomStore("Henrique Brauveres", POLL_MS);
  store.open();
  return { server, store };
}

const calls = (server: ReturnType<typeof installFakeApi>, key: string) =>
  server.calls.filter((c) => `${c.method} ${c.path}` === key).length;

const settle = () => vi.advanceTimersByTimeAsync(0);

/**
 * Holds the next request to `path`: the API answers at once (as things were then), but the
 * answer only arrives when the test lets it go.
 */
function holdNext(path: string) {
  const real = window.fetch;
  let release = () => {};
  const gate = new Promise<void>((resolve) => (release = resolve));
  let held = false;
  vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    const answer = real(input, init);
    if (!held && String(input) === path) {
      held = true;
      await gate;
    }
    return answer;
  });
  return release;
}

afterEach(() => {
  vi.useRealTimers();
});

describe("the room's store: my seat", () => {
  it("asks for a seat every interval while waiting, and stops once in", async () => {
    const { server, store } = openStore({ status: "waiting", place: 2 });
    await settle();
    await vi.advanceTimersByTimeAsync(POLL_MS * 2);
    expect(calls(server, "POST /api/room/enter")).toBe(3);
    expect(store.getState().model.seat).toEqual({ status: "waiting", place: 2 });

    server.seat = { status: "in" };
    await vi.advanceTimersByTimeAsync(POLL_MS);
    const asked = calls(server, "POST /api/room/enter");
    await vi.advanceTimersByTimeAsync(POLL_MS * 3);
    expect(calls(server, "POST /api/room/enter")).toBe(asked);
    store.close();
  });

  it("leaves the queue on Cancel, even with a poll on its way, and joins again after", async () => {
    const { server, store } = openStore({ status: "waiting", place: 2 });
    await settle();
    await vi.advanceTimersByTimeAsync(POLL_MS);
    await store.cancel();
    await vi.advanceTimersByTimeAsync(POLL_MS * 2);
    expect(store.getState().model.seat).toEqual({ status: "left" });
    expect(calls(server, "POST /api/room/cancel")).toBe(1);

    store.rejoin();
    await settle();
    expect(store.getState().model.seat).toEqual({ status: "waiting", place: 2 });
    store.close();
  });

  it("keeps Cancel when a poll that left before it answers after", async () => {
    const { store } = openStore({ status: "waiting", place: 2 });
    await settle();
    const release = holdNext("/api/room/enter");
    await vi.advanceTimersByTimeAsync(POLL_MS);

    const cancelled = store.cancel();
    release();
    await cancelled;
    await settle();

    expect(store.getState().model.seat).toEqual({ status: "left" });
    store.close();
  });

  it("starts nothing once closed, even when a poll on its way answers after", async () => {
    const { server, store } = openStore({ status: "waiting", place: 2 });
    const release = holdNext("/api/room/enter");
    await settle();
    store.close();
    server.seat = { status: "in" };
    release();
    await settle();
    const asked = server.calls.length;

    await vi.advanceTimersByTimeAsync(POLL_MS * 5);

    expect(server.calls.length).toBe(asked);
    expect(calls(server, "POST /api/livekit/token")).toBe(0);
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

    await vi.advanceTimersByTimeAsync(POLL_MS * 2);
    expect(calls(server, "GET /api/streams")).toBe(3);
    store.close();
  });

  it("keeps my account's name when the API names me before the video access", async () => {
    const { server, store } = openStore();
    server.here = [{ userId: MY_USER_ID, since: "2026-10-29T10:00:00Z", mine: true }];
    server.failures.set("POST /api/livekit/token", { status: 503, body: { detail: "Video isn't set up." } });
    await settle();
    await vi.advanceTimersByTimeAsync(POLL_MS);

    expect(store.getState().model.me).toBe(`user-${MY_USER_ID}`);
    expect(store.getState().model.names[`user-${MY_USER_ID}`]).toBe("Henrique");
    store.close();
  });

  it("stops every poll and leaves the video room when closed", async () => {
    const { server, store } = openStore();
    await settle();
    store.close();
    const asked = server.calls.length;
    await vi.advanceTimersByTimeAsync(POLL_MS * 3);
    expect(server.calls.length).toBe(asked);
    expect(lastRoom().disconnected).toBe(true);
  });

  it("goes back to the queue and leaves the video room when the API forgot my seat and the room filled up", async () => {
    const { server, store } = openStore();
    await settle();
    const room = lastRoom();
    server.seated = false;
    server.seat = { status: "waiting", place: 1 };
    await vi.advanceTimersByTimeAsync(POLL_MS);
    await settle();
    expect(store.getState().model.seat).toEqual({ status: "waiting", place: 1 });
    expect(room.disconnected).toBe(true);
    store.close();
  });

  it("enters again with my video connection when the API forgot my seat, until it knows again", async () => {
    const { server, store } = openStore();
    await settle();
    server.seated = false;
    await vi.advanceTimersByTimeAsync(POLL_MS);
    await settle();
    const enters = server.calls.filter((c) => c.path === "/api/room/enter");
    expect(enters.at(-1)?.body).toEqual({ participantSid: "PA_me" });
    expect(server.seated).toBe(true);

    await vi.advanceTimersByTimeAsync(POLL_MS * 2);
    const after = calls(server, "POST /api/room/enter");
    await vi.advanceTimersByTimeAsync(POLL_MS * 2);
    expect(calls(server, "POST /api/room/enter")).toBe(after);
    store.close();
  });
});

describe("the room's store: my streams at the API", () => {
  it("drops a poll answer that was on its way when I started a stream", async () => {
    const { store } = openStore();
    await settle();
    const release = holdNext("/api/streams");
    await vi.advanceTimersByTimeAsync(POLL_MS);

    await store.startStream(
      "screen",
      { participantSid: "PA_me", trackSid: "TR" },
      { quality: "1080p", mode: "smooth" },
    );
    release();
    await settle();

    expect(store.getState().model.streams?.map((s) => s.kind)).toEqual(["screen"]);
    expect(store.getState().model.activity.filter((e) => e.kind === "stopped")).toEqual([]);
    store.close();
  });

  it("starts, changes and stops a stream", async () => {
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

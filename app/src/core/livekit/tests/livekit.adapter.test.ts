import { describe, expect, it, vi } from "vitest";
import { lastRoom } from "../../../test/fakeLiveKit";
import { connectedAdapter, shareScreen } from "../../../test/factories/video-room.factory";
import { LiveKitAdapter } from "../livekit.adapter";

const connected = connectedAdapter;

/** A room where Marina and Rafa talk, Marina also sharing her screen. */
async function roomWithTwo() {
  const adapter = await connected();
  const room = lastRoom();
  room.join("user-2", "Marina");
  room.join("user-3", "Rafa");
  room.publishVoice("user-2");
  room.publishVoice("user-3");
  room.publishScreen("user-2");
  return { adapter, room };
}

describe("the connection", () => {
  it("joins with the access it's given, and says it's connected", async () => {
    const adapter = await connected();
    expect(lastRoom().connectedWith).toEqual({ url: "wss://video.test", token: "token" });
    expect(adapter.getState().connection).toBe("connected");
  });

  it("says why the room can't be joined", () => {
    const adapter = new LiveKitAdapter();
    adapter.fail("You need a seat first.");
    expect(adapter.getState()).toMatchObject({ connection: "disconnected", error: "You need a seat first." });
  });

  it("says when the connection drops and LiveKit tries again", async () => {
    const adapter = await connected();
    lastRoom().emit("connectionStateChanged", "reconnecting");
    expect(adapter.getState().connection).toBe("reconnecting");
  });

  it("starts each room afresh, and ignores one that finishes joining after it was left", async () => {
    const adapter = await connected();
    lastRoom().join("user-2", "Marina");
    const first = adapter.connect("wss://video.test", "late");
    adapter.disconnect();
    await first;

    expect(adapter.getState().others).toEqual([]);
    expect(adapter.getState().connection).not.toBe("connected");
  });

  it("stops hearing a room it left", async () => {
    const adapter = await connected();
    const room = lastRoom();
    adapter.disconnect();
    const before = adapter.getState();
    expect(before.connection).toBe("disconnected");

    room.join("user-9", "Late");

    expect(room.disconnected).toBe(true);
    expect(adapter.getState()).toBe(before);
  });

  it("tells its listeners about each change, until they stop listening", async () => {
    const adapter = await connected();
    const listener = vi.fn();
    const stop = adapter.subscribe(listener);
    lastRoom().join("user-2", "Marina");
    stop();
    lastRoom().join("user-3", "Rafa");
    expect(listener).toHaveBeenCalled();
    const calls = listener.mock.calls.length;
    lastRoom().join("user-4", "Ana");
    expect(listener).toHaveBeenCalledTimes(calls);
  });
});

describe("each event changes only what it's about", () => {
  it("someone starting to talk changes only their talking state", async () => {
    const { adapter, room } = await roomWithTwo();
    const before = adapter.getState();

    room.setSpeaking("user-2", true);

    const after = adapter.getState();
    expect(after.remote["user-2"]?.speaking).toBe(true);
    expect(after.remote["user-2"]?.screen).toBe(before.remote["user-2"]?.screen);
    expect(after.remote["user-3"]).toBe(before.remote["user-3"]);
    expect(after.others).toBe(before.others);
  });

  it("someone's camera starting changes only their entry", async () => {
    const { adapter, room } = await roomWithTwo();
    const before = adapter.getState();

    room.publishCamera("user-3");

    const after = adapter.getState();
    expect(after.remote["user-3"]?.camera).toBeDefined();
    expect(after.remote["user-2"]).toBe(before.remote["user-2"]);
    expect(after.others).toBe(before.others);
  });

  it("someone joining adds them to the people and the presence, and leaves the rest alone", async () => {
    const { adapter, room } = await roomWithTwo();
    const before = adapter.getState();

    room.join("user-5", "Bruno");

    const after = adapter.getState();
    expect(after.others.map((p) => p.name)).toEqual(["Marina", "Rafa", "Bruno"]);
    expect(after.presence.at(-1)).toMatchObject({ kind: "joined", identity: "user-5" });
    expect(after.remote).toBe(before.remote);
  });

  it("someone leaving takes only them out", async () => {
    const { adapter, room } = await roomWithTwo();
    const rafa = adapter.getState().remote["user-3"];

    room.leave("user-2");

    const after = adapter.getState();
    expect(after.remote["user-2"]).toBeUndefined();
    expect(after.remote["user-3"]).toBe(rafa);
    expect(after.presence.at(-1)).toMatchObject({ kind: "left", identity: "user-2" });
  });

  it("a voice muted by its person stops showing them talking", async () => {
    const { adapter, room } = await roomWithTwo();
    room.setSpeaking("user-2", true);

    room.muteVoice("user-2", true);

    expect(adapter.getState().remote["user-2"]).toMatchObject({ hasVoice: false, speaking: false });
  });
});

describe("events about what people send", () => {
  it("someone stopping their screen takes it out of their entry only", async () => {
    const { adapter, room } = await roomWithTwo();
    const rafa = adapter.getState().remote["user-3"];

    room.unpublish("user-2", "screen_share");

    expect(adapter.getState().remote["user-2"]?.screen).toBeUndefined();
    expect(adapter.getState().remote["user-3"]).toBe(rafa);
  });

  it("a voice unmuted by its person can show them talking again", async () => {
    const { adapter, room } = await roomWithTwo();
    room.muteVoice("user-2", true);

    room.muteVoice("user-2", false);
    room.setSpeaking("user-2", true);

    expect(adapter.getState().remote["user-2"]).toMatchObject({ hasVoice: true, speaking: true });
  });

  it("reads a sharer's picture size when asked, as it changes", async () => {
    const { adapter, room } = await roomWithTwo();
    const screen = adapter.getState().remote["user-2"]!.screen!;

    room.screenPublication("user-2")!.dimensions = { width: 1280, height: 720 };

    expect(screen.height).toBe(720);
  });

  it("my share ended from the browser's own bar shows I'm no longer sharing", async () => {
    const adapter = await connected();
    await shareScreen(adapter, false);
    expect(adapter.getState().publishing.screen).toBe(true);

    lastRoom().browserStopsMyShare();

    expect(adapter.getState().publishing.screen).toBe(false);
  });
});

describe("the page's sound", () => {
  it("asks the browser to play sound until it does", async () => {
    const adapter = await connected();
    const room = lastRoom() as unknown as { startAudio: ReturnType<typeof vi.fn>; canPlaybackAudio?: boolean };
    room.startAudio.mockClear();

    adapter.unlockAudio();
    room.canPlaybackAudio = true;
    adapter.unlockAudio();

    expect(room.startAudio).toHaveBeenCalledTimes(1);
  });
});

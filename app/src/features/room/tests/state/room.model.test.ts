import { describe, expect, it } from "vitest";
import { aLiveStream, anAnswer } from "../../../../test/factories/streams-state.factory";
import {
  initialRoom,
  withMe,
  withMyStep,
  withSeat,
  withStreams,
  withStreamsCall,
  withVideo,
} from "../../state/room.model";
import { personIdOf, userIdOf } from "../../utils/person-id.util";

const AT = Date.parse("2026-10-29T10:05:00Z");
const marinaScreen = () => aLiveStream();
const marinaCamera = () => aLiveStream({ kind: "camera" });

describe("the room's model", () => {
  it("names me by my id, with my first name", () => {
    const room = withMe(initialRoom(), "user-7", "Henrique Brauveres");
    expect(room.me).toBe("user-7");
    expect(room.names["user-7"]).toBe("Henrique");
    expect(withMe(room, "user-7", "Henrique Brauveres")).toBe(room);
  });

  it("finds my id in the API's answer when the video access hasn't named me yet", () => {
    const room = withStreams(
      initialRoom(),
      anAnswer({ here: [{ userId: 7, since: "2026-10-29T10:00:00Z", mine: true }] }),
      AT,
    );
    expect(room.me).toBe("user-7");
  });

  it("takes the streams by person, and starts the activity from the first answer without events", () => {
    const room = withStreams(initialRoom(), anAnswer({ streams: [marinaScreen()], free: 5 }), AT);
    expect(room.streams).toEqual([
      {
        personId: "user-2",
        kind: "screen",
        since: Date.parse(marinaScreen().since),
        settings: marinaScreen().settings,
      },
    ]);
    expect(room.names["user-2"]).toBe("Marina");
    expect(room.free).toBe(5);
    expect(room.activity).toEqual([]);
  });

  it("logs a stream starting and another stopping, by its person", () => {
    const first = withStreams(initialRoom(), anAnswer({ streams: [marinaScreen()] }), AT);
    const next = withStreams(first, anAnswer({ streams: [marinaCamera()] }), AT + 2000);
    expect(next.activity.map((e) => [e.kind, e.actorId, e.stream])).toEqual([
      ["started", "user-2", "camera"],
      ["stopped", "user-2", "screen"],
    ]);
    expect(new Set(next.activity.map((e) => e.id)).size).toBe(2);
  });

  it("keeps the same streams list while nothing about the streams changed", () => {
    const first = withStreams(initialRoom(), anAnswer({ streams: [marinaScreen()] }), AT);
    const again = withStreams(first, anAnswer({ streams: [marinaScreen()], free: 4 }), AT + 2000);
    expect(again.streams).toBe(first.streams);
    expect(again.free).toBe(4);
  });

  it("takes who watches whom and when each arrived, and copes with an API without them", () => {
    const room = withStreams(
      initialRoom(),
      anAnswer({
        watching: [{ userId: 3, sharerId: 2, kind: "screen", mine: false }],
        here: [{ userId: 3, since: "2026-10-29T10:01:00Z", mine: false }],
        seats: { total: 20, taken: 3, waiting: 0 },
      }),
      AT,
    );
    expect(room.watching).toEqual({ "user-3": { sharerId: "user-2", kind: "screen" } });
    expect(room.arrivedAt).toEqual({ "user-3": Date.parse("2026-10-29T10:01:00Z") });
    expect(room.seats).toEqual({ total: 20, taken: 3, waiting: 0 });
    const older = withStreams(initialRoom(), anAnswer(), AT);
    expect([older.watching, older.seats, older.arrivedAt]).toEqual([null, null, {}]);
  });

  it("marks when the regular poll answered, and not a refresh after a failed call", () => {
    const polled = withStreams(initialRoom(), anAnswer(), AT, true);
    expect(polled.polledAt).toBe(AT);
    expect(withStreams(polled, anAnswer(), AT + 500).polledAt).toBe(AT);
  });

  it("says when the API doesn't know I'm in the room", () => {
    expect(withStreams(initialRoom(), anAnswer({ seated: false }), AT).seated).toBe(false);
  });

  it("takes who's connected, in order, and keeps the list while it's the same people", () => {
    const room = withVideo(initialRoom(), [{ identity: "user-2", name: "Marina Souza" }], "connected", AT);
    expect(room.present).toEqual(["user-2"]);
    expect(room.names["user-2"]).toBe("Marina");
    expect(withVideo(room, [{ identity: "user-2", name: "Marina Souza" }], "connected", AT)).toBe(room);
  });

  it("logs my connection coming back after a drop", () => {
    const room = withMe(initialRoom(), "user-7", "Henrique");
    const dropped = withVideo(room, [], "reconnecting", AT);
    const back = withVideo(dropped, [], "connected", AT + 3000);
    expect(back.activity.at(-1)).toMatchObject({ kind: "reconnected", actorId: "user-7", at: AT + 3000 });
  });

  it("keeps my seat, or my place in the queue, and its failure", () => {
    const room = withSeat(initialRoom(), { status: "waiting", place: 2 });
    expect(room.seat).toEqual({ status: "waiting", place: 2 });
    expect(withSeat(room, room.seat, "Couldn't reach the room.").seatError).toBe("Couldn't reach the room.");
  });

  it("knows when a start, change or stop is on its way, and why it failed", () => {
    const busy = withStreamsCall(initialRoom(), true, null);
    expect(busy.streamsBusy).toBe(true);
    expect(withStreamsCall(busy, false, "The 6 places are taken.").streamsError).toBe("The 6 places are taken.");
  });

  it("moves my streams only along their steps", () => {
    let room = initialRoom();
    for (const step of ["picking", "starting", "live", "stopping", "off"] as const) {
      room = withMyStep(room, "screen", step);
      expect(room.mine.screen).toBe(step);
    }
    // From off, a stream can't be stopping or starting; the camera is its own.
    expect(withMyStep(room, "screen", "stopping")).toBe(room);
    expect(withMyStep(room, "camera", "starting")).toBe(room);
  });

  it("makes everyone's id from their user id, and back", () => {
    expect(personIdOf(42)).toBe("user-42");
    expect(userIdOf("user-42")).toBe(42);
  });

  it("keeps who watches whom, the arrivals and the seats while the API says the same", () => {
    const answer = () =>
      anAnswer({
        watching: [{ userId: 3, sharerId: 2, kind: "screen", mine: false }],
        here: [{ userId: 3, since: "2026-10-29T10:01:00Z", mine: false }],
        seats: { total: 20, taken: 3, waiting: 0 },
      });
    const first = withStreams(initialRoom(), answer(), AT);
    const again = withStreams(first, answer(), AT + 2000);
    expect([again.watching, again.arrivedAt, again.seats]).toEqual([first.watching, first.arrivedAt, first.seats]);
    expect(again.watching).toBe(first.watching);
    expect(again.arrivedAt).toBe(first.arrivedAt);
    expect(again.seats).toBe(first.seats);
  });
});

import type { LiveStream, StreamKind, StreamsState } from "@core/api/api.types";
import type { ConnectionState, RoomPerson } from "@core/livekit/livekit.types";
import type { ActivityEvent } from "../../../types";
import { ACTIVITY_KEPT, NEXT_STEPS, STREAM_PLACES } from "./room.constants";
import type { MyStreamStep, PersonId, RoomModel, RoomStream, SeatState, Watch } from "./room.types";

/** Someone's id in the room, from their user id at the API. */
export const personIdOf = (userId: number): PersonId => `user-${userId}`;

/** The name the room shows: the first word, or "Someone". */
export const firstName = (name: string | null | undefined) => name?.trim().split(/\s+/)[0] || "Someone";

export const initialRoom = (): RoomModel => ({
  me: null,
  names: {},
  present: [],
  polledAt: 0,
  streams: null,
  free: STREAM_PLACES,
  seats: null,
  seated: null,
  watching: null,
  arrivedAt: {},
  seat: null,
  seatError: null,
  streamsError: null,
  streamsBusy: false,
  activity: [],
  eventCount: 0,
  mine: { screen: "off", camera: "off" },
  connection: "connecting",
});

/** The room with these names added; the same record when every name is already there. */
function withNames(names: Record<PersonId, string>, added: [PersonId, string][]) {
  const fresh = added.filter(([id, name]) => names[id] !== name);
  return fresh.length ? { ...names, ...Object.fromEntries(fresh) } : names;
}

function withEvents(model: RoomModel, events: Omit<ActivityEvent, "id">[]): RoomModel {
  if (!events.length) return model;
  const numbered = events.map((e, i) => ({ ...e, id: `room${model.eventCount + i + 1}` }));
  return {
    ...model,
    activity: [...model.activity, ...numbered].slice(-ACTIVITY_KEPT),
    eventCount: model.eventCount + events.length,
  };
}

/** I'm named: by the video access, or the API listing something of mine. */
export function withMe(model: RoomModel, me: PersonId, name: string): RoomModel {
  if (model.me === me && model.names[me] === firstName(name)) return model;
  return { ...model, me, names: withNames(model.names, [[me, firstName(name)]]) };
}

export function withSeat(model: RoomModel, seat: SeatState, seatError: string | null = null): RoomModel {
  return model.seat === seat && model.seatError === seatError ? model : { ...model, seat, seatError };
}

/** A start, change or stop on its way (busy), or back with its failure. */
export const withStreamsCall = (model: RoomModel, streamsBusy: boolean, streamsError: string | null): RoomModel =>
  model.streamsBusy === streamsBusy && model.streamsError === streamsError
    ? model
    : { ...model, streamsBusy, streamsError };

const keyOf = (s: RoomStream) => `${s.personId}|${s.kind}`;

const sameStream = (s: RoomStream, o: RoomStream | undefined) =>
  o !== undefined &&
  keyOf(s) === keyOf(o) &&
  s.since === o.since &&
  s.settings.quality === o.settings.quality &&
  s.settings.mode === o.settings.mode;

const sameStreams = (a: RoomStream[] | null, b: RoomStream[]) =>
  a !== null && a.length === b.length && a.every((s, i) => sameStream(s, b[i]));

const streamOf = (s: LiveStream): RoomStream => ({
  personId: personIdOf(s.userId),
  kind: s.kind,
  since: Date.parse(s.since),
  settings: s.settings,
});

/** What started and stopped since the last answer. The first answer is where the room starts: nothing. */
function streamEvents(before: RoomStream[] | null, now: RoomStream[], at: number): Omit<ActivityEvent, "id">[] {
  if (before === null) return [];
  const was = new Set(before.map(keyOf));
  const is = new Set(now.map(keyOf));
  const event = (kind: "started" | "stopped") => (s: RoomStream) => ({ at, kind, actorId: s.personId, stream: s.kind });
  return [
    ...now.filter((s) => !was.has(keyOf(s))).map(event("started")),
    ...before.filter((s) => !is.has(keyOf(s))).map(event("stopped")),
  ];
}

function watchesOf(answer: StreamsState): Record<PersonId, Watch> | null {
  if (!answer.watching) return null;
  return Object.fromEntries(
    answer.watching.map((w) => [personIdOf(w.userId), { sharerId: personIdOf(w.sharerId), kind: w.kind }]),
  );
}

/** Whose user id is mine, when the API lists something of mine. */
function myIdIn(answer: StreamsState): PersonId | null {
  const mine = [...answer.streams, ...(answer.here ?? []), ...(answer.watching ?? [])].find((x) => x.mine);
  return mine ? personIdOf(mine.userId) : null;
}

/** The API's answer about the streams, who watches what and who's here. */
export function withStreams(model: RoomModel, answer: StreamsState, at: number, polled = false): RoomModel {
  const now = answer.streams.map(streamOf);
  const streams = sameStreams(model.streams, now) ? model.streams : now;
  const me = model.me ?? myIdIn(answer);
  const next: RoomModel = {
    ...model,
    me,
    names: withNames(
      model.names,
      answer.streams.filter((s) => !s.mine).map((s) => [personIdOf(s.userId), firstName(s.name)]),
    ),
    polledAt: polled ? at : model.polledAt,
    streams,
    free: answer.free,
    seats: answer.seats ?? null,
    seated: answer.seated,
    watching: watchesOf(answer),
    arrivedAt: Object.fromEntries((answer.here ?? []).map((h) => [personIdOf(h.userId), Date.parse(h.since)])),
  };
  return withEvents(next, streamEvents(model.streams, now, at));
}

const samePeople = (a: PersonId[], b: PersonId[]) => a.length === b.length && a.every((id, i) => id === b[i]);

/** The video room's news: who's connected, and the connection coming back after a drop. */
export function withVideo(model: RoomModel, others: RoomPerson[], connection: ConnectionState, at: number): RoomModel {
  const present = others.map((p) => p.identity);
  const next: RoomModel = {
    ...model,
    present: samePeople(model.present, present) ? model.present : present,
    // The API's names come first: the video room only names people the room doesn't know yet.
    names: withNames(
      model.names,
      others.filter((p) => !(p.identity in model.names)).map((p) => [p.identity, firstName(p.name)]),
    ),
    connection,
  };
  const me = model.me;
  const back = model.connection === "reconnecting" && connection === "connected" && me !== null;
  const events = back && me !== null ? [{ at, kind: "reconnected" as const, actorId: me }] : [];
  const changed =
    next.present !== model.present || next.names !== model.names || connection !== model.connection || back;
  return changed ? withEvents(next, events) : model;
}

/** Moves one of my streams to its next step; a step it can't take from where it is changes nothing. */
export function withMyStep(model: RoomModel, kind: StreamKind, step: MyStreamStep): RoomModel {
  if (!NEXT_STEPS[model.mine[kind]].includes(step)) return model;
  return { ...model, mine: { ...model.mine, [kind]: step } };
}

import type { StreamKind, StreamsState } from "@services/xove-api-service";
import type { ConnectionState, RoomPerson } from "@services/livekit-service";
import { NEXT_STEPS, STREAM_PLACES } from "../../constants/room.constants";
import type { MyStreamStep, PersonId, RoomModel, SeatState } from "../../types/room.types";
import { personIdOf } from "../../utils/person-id.util";
import { firstName } from "../../utils/first-name.util";
import { keepSame } from "./utils/keep-same.util";
import { samePeople } from "./utils/same-people.util";
import { sameStreams, streamOf, streamEvents } from "./utils/room-streams.util";
import { withNames, watchesOf, myIdIn } from "./utils/room-answer.util";
import { withEvents } from "./utils/activity-events.util";

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
    seats: answer.seats ? keepSame(model.seats, answer.seats) : null,
    seated: answer.seated,
    watching: watchesOf(model.watching, answer),
    arrivedAt: keepSame(
      model.arrivedAt,
      Object.fromEntries((answer.here ?? []).map((h) => [personIdOf(h.userId), Date.parse(h.since)])),
    ),
  };
  return withEvents(next, streamEvents(model.streams, now, at));
}

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
  const events = me !== null && back ? [{ at, kind: "reconnected" as const, actorId: me }] : [];
  const changed =
    next.present !== model.present || next.names !== model.names || connection !== model.connection || back;
  return changed ? withEvents(next, events) : model;
}

/** Moves one of my streams to its next step; a step it can't take from where it is changes nothing. */
export function withMyStep(model: RoomModel, kind: StreamKind, step: MyStreamStep): RoomModel {
  if (!NEXT_STEPS[model.mine[kind]].includes(step)) return model;
  return { ...model, mine: { ...model.mine, [kind]: step } };
}

import type { LiveStream } from "@services/xove-api-service/types/api.types";
import type { ActivityEvent } from "@features/room/types/room-view.types";
import type { RoomStream } from "../../../types/room.types";
import { personIdOf } from "../../../utils/person-id.util";

const keyOf = (s: RoomStream) => `${s.personId}|${s.kind}`;

const sameStream = (s: RoomStream, o: RoomStream | undefined) =>
  o !== undefined &&
  keyOf(s) === keyOf(o) &&
  s.since === o.since &&
  s.settings.quality === o.settings.quality &&
  s.settings.mode === o.settings.mode;

export const sameStreams = (a: RoomStream[] | null, b: RoomStream[]) =>
  a !== null && a.length === b.length && a.every((s, i) => sameStream(s, b[i]));

export const streamOf = (s: LiveStream): RoomStream => ({
  personId: personIdOf(s.userId),
  kind: s.kind,
  since: Date.parse(s.since),
  settings: s.settings,
});

/** What started and stopped since the last answer. The first answer is where the room starts: nothing. */
export function streamEvents(before: RoomStream[] | null, now: RoomStream[], at: number): Omit<ActivityEvent, "id">[] {
  if (before === null) return [];
  const was = new Set(before.map(keyOf));
  const is = new Set(now.map(keyOf));
  const event = (kind: "started" | "stopped") => (s: RoomStream) => ({ at, kind, actorId: s.personId, stream: s.kind });
  return [
    ...now.filter((s) => !was.has(keyOf(s))).map(event("started")),
    ...before.filter((s) => !is.has(keyOf(s))).map(event("stopped")),
  ];
}

import type { RemoteMedia } from "@services/livekit-service";
import type { StreamsState } from "@services/xove-api-service";
import { personIdOf } from "../../../utils/person-id.util";

/** The screens and cameras the video room shows others sending now, as "<person>:<kind>". */
export function sentVideos(remote: Record<string, RemoteMedia>): Set<string> {
  const sent = new Set<string>();
  for (const [id, media] of Object.entries(remote)) {
    if (media.screen) sent.add(`${id}:screen`);
    if (media.camera) sent.add(`${id}:camera`);
  }
  return sent;
}

/**
 * The streams that have ended, as the video room saw it: what was sent and isn't any more (while
 * connected: a connection dropping isn't a stop), less what's sent again.
 */
export function endedNow(ended: Set<string>, before: Set<string>, now: Set<string>): Set<string> {
  const next = new Set([...ended, ...[...before].filter((k) => !now.has(k))]);
  for (const k of now) next.delete(k);
  return next;
}

/** The API's answer without the streams that have ended; and those ended that it no longer lists. */
export function withoutEnded(answer: StreamsState, ended: Set<string>): { answer: StreamsState; ended: Set<string> } {
  const keyOf = (s: StreamsState["streams"][number]) => `${personIdOf(s.userId)}:${s.kind}`;
  const listed = new Set(answer.streams.map(keyOf));
  const still = new Set([...ended].filter((k) => listed.has(k)));
  if (still.size === 0) return { answer, ended: still };
  return { answer: { ...answer, streams: answer.streams.filter((s) => !still.has(keyOf(s))) }, ended: still };
}

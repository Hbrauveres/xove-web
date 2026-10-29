import { userIdOf } from "./person-id.util";
import type { PersonId, Watch } from "../types/room.types";
import type { WatchingTarget } from "@services/xove-api-service";
import type { OnStage } from "../types/watch-report.types";

/** A report as a key, to compare: "42|screen", or "none"; undefined while there's nothing to say. */
export function wantedKeyOf(onStage: OnStage | undefined): string | undefined {
  if (onStage === undefined) return undefined;
  if (onStage === null) return "none";
  const userId = userIdOf(onStage.personId);
  return Number.isNaN(userId) ? undefined : `${userId}|${onStage.kind}`;
}

/** What the API last knew of my stage, as a key; undefined from an older API that lists no watches. */
export function knownKeyOf(watching: Record<PersonId, Watch> | null, me: PersonId | null): string | undefined {
  if (watching === null) return undefined;
  const mine = me ? watching[me] : undefined;
  return mine ? `${userIdOf(mine.sharerId)}|${mine.kind}` : "none";
}

/**
 * Whether to report what's on my stage: only from a page in the video room (a second tab, or one
 * disconnected, would overwrite it back and forth), and only when the API doesn't know it yet. An
 * older API lists no watches: then only what wasn't sent already.
 */
export function shouldReport(
  wanted: string | undefined,
  known: string | undefined,
  sent: string | undefined,
  inRoom: boolean,
): boolean {
  if (wanted === undefined || !inRoom) return false;
  return known === undefined ? sent !== wanted : known !== wanted;
}

/** The report itself, from its key. */
export function targetOf(key: string): WatchingTarget {
  if (key === "none") return null;
  const [sharerId, kind] = key.split("|");
  return { sharerId: Number(sharerId), kind: kind === "camera" ? "camera" : "screen" };
}

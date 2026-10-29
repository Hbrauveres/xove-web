import type { StreamKind } from "@core/api/types/api.types";
import type { PersonId } from "../state/room.types";

/** What's on my stage: someone's stream, or nothing (null). */
export type OnStage = { personId: PersonId; kind: StreamKind } | null;

/** What the API is told: someone's stream by their user id, or nothing. */
export type WatchTarget = { sharerId: number; kind: StreamKind } | null;

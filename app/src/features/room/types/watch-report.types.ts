import type { StreamKind } from "@core/api/types/api.types";
import type { PersonId } from "../state/room.types";

/** What's on my stage: someone's stream, or nothing (null). */
export type OnStage = { personId: PersonId; kind: StreamKind } | null;

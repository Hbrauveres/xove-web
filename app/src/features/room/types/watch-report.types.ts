import type { StreamKind, WatchingTarget } from "@services/xove-api-service/types/api.types";
import type { PersonId, Watch } from "./room.types";

/** What's on my stage: someone's stream, or nothing (null). */
export type OnStage = { personId: PersonId; kind: StreamKind } | null;

export type WatchReportInputs = {
  /** Who watches what, as the API last said; null from an older API. */
  watching: Record<PersonId, Watch> | null;
  me: PersonId | null;
  /** This page is in the video room (and the API knows my seat). */
  inRoom: boolean;
  report: (target: WatchingTarget) => Promise<void>;
  /** What's on my stage now. */
  onStage: OnStage;
};

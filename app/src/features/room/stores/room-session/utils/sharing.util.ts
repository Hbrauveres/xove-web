import type { StreamKind } from "@services/xove-api-service";
import type { OnStage } from "../../../types/watch-report.types";
import type { Sharer } from "../../../types/room-view.types";
import type { StagePick } from "../../../types/stage.types";
import type { SharingOf } from "../types/room-session.types";

/** What each person shares, by their id. */
export const sharingOf = (sharers: Sharer[]): SharingOf =>
  Object.fromEntries(sharers.map((s) => [s.person.id, { screen: Boolean(s.screen), camera: Boolean(s.camera) }]));

/** Whether a person's stream of that kind is live. */
export const liveIn =
  (sharing: SharingOf) =>
  (personId: string, kind: StreamKind): boolean =>
    Boolean(sharing[personId]?.[kind]);

/** What's on my stage, once it's someone's stream. */
export const onMyStage = (pick: StagePick): OnStage =>
  pick.big && pick.mainKind ? { personId: pick.big.person.id, kind: pick.mainKind } : null;

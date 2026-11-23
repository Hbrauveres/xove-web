import type { GoLiveActions } from "../../../../types/go-live.types";

/** Go live's actions; with nobody live, no stream place is taken. */
export type StageEmptyStageProps = Omit<GoLiveActions, "full">;

import type { GoLiveActions } from "../../../../types/go-live.types";

export interface StageGoLiveProps extends GoLiveActions {
  /** Its menu centred over it rather than ending at its right: on the empty stage, in the middle. */
  menuOverButton?: boolean | undefined;
}

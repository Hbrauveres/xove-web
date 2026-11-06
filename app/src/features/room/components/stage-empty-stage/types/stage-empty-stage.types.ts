import type { StreamKind } from "@services/xove-api-service";

export interface StageEmptyStageProps {
  canShareScreen?: boolean | undefined;
  onStart?: ((kind: StreamKind) => void) | undefined;
  /** The TV turns on now: the first time the stage stands by in this visit. */
  turnOn: boolean;
  /** Said once it stands by, so the stage knows the TV has turned on. */
  onStandby: () => void;
}

import type { StreamKind } from "@services/xove-api-service";

export interface StageEmptyStageProps {
  canShareScreen?: boolean | undefined;
  onStart?: ((kind: StreamKind) => void) | undefined;
}

import type { StreamKind } from "@services/xove-api-service";

export interface StageStartButtonsProps {
  /** Whether this browser can share a screen: where it can't, the camera comes first and the screen is greyed. */
  canShareScreen?: boolean | undefined;
  onStart?: ((kind: StreamKind) => void) | undefined;
}

import type { StreamKind } from "@services/xove-api-service";

export interface StageGoLiveProps {
  canShareScreen: boolean;
  /** Every stream place is taken: why its ways to start are greyed. */
  full?: string | undefined;
  onStart: (kind: StreamKind) => void;
  onSettings: () => void;
}

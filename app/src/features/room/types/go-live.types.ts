import type { StreamKind } from "@services/xove-api-service";

/** What Go live does, wherever it's offered: its own menu, or "…" once it folded there. */
export interface GoLiveActions {
  canShareScreen: boolean;
  /** Every stream place is taken: why its ways to start are greyed. */
  full?: string | undefined;
  onStart: (kind: StreamKind) => void;
  onSettings: () => void;
}

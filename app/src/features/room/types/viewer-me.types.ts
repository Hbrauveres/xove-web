import type { StreamKind } from "@services/xove-api-service";

/** Me, at the right of the bar over someone else's stream: what the bar and its right side both take. */
export interface ViewerMe {
  /** My mic while I'm live, or Go live. */
  live: boolean;
  micOn?: boolean | undefined;
  onMic?: (() => void) | undefined;
  canShareScreen: boolean;
  /** Every stream place is taken: why Go live's ways to start are greyed. */
  full?: string | undefined;
  onStart: (kind: StreamKind) => void;
  onSettings: () => void;
  /** Only the settings (nobody live). */
  settingsOnly?: boolean | undefined;
}

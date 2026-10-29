import type { StreamKind, StreamSettings } from "@core/api/types/api.types";

export type StreamSettingsInputs = {
  /** My streams the API lists as live, and the ones this browser sends. */
  live: Record<StreamKind, boolean>;
  publishing: Record<StreamKind, boolean>;
  applySettings: (kind: StreamKind, settings: StreamSettings) => Promise<void>;
  /** Tells the API; true when it accepted. */
  changeAtApi: (kind: StreamKind, settings: StreamSettings) => Promise<boolean>;
};

import type { RefCallback } from "react";

/** Where the settings open from: the controls hand the stage their cog and their row of buttons. */
export interface SettingsAnchor {
  /** The button the settings open over: the cog, or Go live where they came from its menu. */
  cog: RefCallback<HTMLElement>;
  /** The row of buttons the settings sit just above. */
  row: RefCallback<HTMLElement>;
}

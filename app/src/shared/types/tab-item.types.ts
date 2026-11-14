import type { IconName } from "@shared/types/icon.types";

/** One tab: its words and icon, whether what it holds is live, and why it can't be used, if it can't. */
export interface TabItem<K extends string> {
  key: K;
  label: string;
  icon: IconName;
  /** What it holds is live: a red dot by its icon. */
  live?: boolean | undefined;
  /** Can't be used here: greyed in place, saying why in its tooltip, and in a toast on a touch. */
  unavailable?: { reason: string; icon: IconName } | undefined;
}

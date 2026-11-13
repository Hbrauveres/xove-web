import type { ReactNode } from "react";
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

export interface TabsProps<K extends string> {
  tabs: TabItem<K>[];
  /** The chosen tab (a usable one). */
  chosen: K;
  onChoose: (key: K) => void;
  /** What a usable tab holds. Every panel is drawn in one cell, the hidden ones invisible. */
  panel: (key: K) => ReactNode;
  /** The tablist's place in its holder. */
  className?: string | undefined;
  /** The panels' holder: where they scroll, which is the holder's choice. */
  panelsClassName?: string | undefined;
  /** Each panel's own layout. */
  panelClassName?: string | undefined;
  /** The panels scroll with the app's slim scrollbar. */
  slimScroll?: boolean | undefined;
}

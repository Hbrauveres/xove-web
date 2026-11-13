import type { ReactNode } from "react";
import type { TabItem } from "@shared/types/tab-item.types";

export interface TabsProps<K extends string> {
  tabs: TabItem<K>[];
  /** The chosen tab (a usable one). */
  chosen: K;
  onChoose: (key: K) => void;
  /** What a usable tab holds. Every panel is drawn in one cell, the hidden ones invisible. */
  panel: (key: K) => ReactNode;
  /** Its holder has just opened: the chosen tab takes the focus. */
  focused?: boolean | undefined;
  /** The tablist's place in its holder. */
  className?: string | undefined;
  /** The panels' holder: where they scroll, which is the holder's choice. */
  panelsClassName?: string | undefined;
  /** Each panel's own layout. */
  panelClassName?: string | undefined;
  /** The panels scroll with the app's slim scrollbar. */
  slimScroll?: boolean | undefined;
}

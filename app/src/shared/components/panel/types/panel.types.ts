import type { HTMLAttributes, ReactNode, Ref } from "react";

export interface PanelProps extends HTMLAttributes<HTMLElement> {
  /**
   * A page's region, a status that speaks its changes (output), a panel beside the page that keeps
   * it usable (the browser's own non-modal dialog, open), or a plain box.
   */
  as?: "div" | "section" | "output" | "dialog" | undefined;
  ref?: Ref<HTMLDivElement> | undefined;
  children: ReactNode;
}

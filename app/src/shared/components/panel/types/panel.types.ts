import type { HTMLAttributes, ReactNode, Ref } from "react";

export interface PanelProps extends HTMLAttributes<HTMLElement> {
  /** A page's region, a status that speaks its changes (output), or a plain box. */
  as?: "div" | "section" | "output" | undefined;
  ref?: Ref<HTMLDivElement> | undefined;
  children: ReactNode;
}

import type { HTMLAttributes, ReactNode, Ref } from "react";

export interface PanelProps extends HTMLAttributes<HTMLElement> {
  /** A page's region, or a plain box. */
  as?: "div" | "section" | undefined;
  ref?: Ref<HTMLDivElement> | undefined;
  children: ReactNode;
}

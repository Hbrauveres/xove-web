import type { HTMLAttributes, ReactNode, Ref } from "react";

export interface PanelProps extends HTMLAttributes<HTMLElement> {
  /** Sections with a clear cut between them, each its own glass (PanelSection), instead of one box. */
  cuts?: boolean | undefined;
  /** A page's region, or a plain box. */
  as?: "div" | "section" | undefined;
  ref?: Ref<HTMLDivElement> | undefined;
  children: ReactNode;
}

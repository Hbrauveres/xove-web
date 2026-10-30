import type { HTMLAttributes, ReactNode } from "react";

export interface HeadlineProps extends HTMLAttributes<HTMLHeadingElement> {
  /** The page's own heading (h1), or a section's (h2). */
  level: "page" | "section";
  /** The words, with the key ones in <em>: shown in the accent, in capitals. */
  children: ReactNode;
}

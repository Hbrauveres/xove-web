import type { ReactNode } from "react";

export interface PageTextProps {
  /**
   * - lead: the line under a page's heading, what to read first
   * - note: a quiet small line (who can join, what an action does, an empty list)
   */
  variant: "lead" | "note";
  children: ReactNode;
  /** Its place, set by what holds it. */
  className?: string | undefined;
}

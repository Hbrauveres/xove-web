import type { ReactNode } from "react";

export interface LabelPillProps {
  /** What leads the words: a face, or an icon. */
  lead: ReactNode;
  children: ReactNode;
  /** Where it sits, set by the piece that places it. */
  className?: string | undefined;
}

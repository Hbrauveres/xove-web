import type { ReactNode } from "react";

export interface PanelSectionProps {
  /** For a list that may be long. */
  scroll?: boolean;
  className?: string | undefined;
  children: ReactNode;
}

import type { ReactNode } from "react";

export interface DropdownSectionProps {
  /** For a list that may be long. */
  scroll?: boolean;
  className?: string | undefined;
  children: ReactNode;
}

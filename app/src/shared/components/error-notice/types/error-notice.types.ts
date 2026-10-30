import type { ReactNode } from "react";

export interface ErrorNoticeProps {
  children: ReactNode;
  /** The page's own class, for where the notice sits. */
  className?: string | undefined;
}

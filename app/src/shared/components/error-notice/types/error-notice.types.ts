import type { ReactNode } from "react";

export interface ErrorNoticeProps {
  children: ReactNode;
  /** Over the stage or the page, where a see-through tint would show what's behind. */
  floating?: boolean;
}

import type { ReactNode } from "react";

export interface HeaderProps {
  /** The activity, in the middle. */
  middle: ReactNode;
  /** The people and my account, at the right. */
  right: ReactNode;
}

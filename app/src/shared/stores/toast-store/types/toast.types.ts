import type { ReactNode } from "react";

export type ToastMessage = {
  /** Counts up with every toast, so the same message shown again starts over. */
  id: number;
  text: string;
  /** What it's about, as an icon: the control that was touched, crossed out. */
  icon?: ReactNode;
};

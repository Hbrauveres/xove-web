import type { ReactNode } from "react";

export interface DropUpRowProps {
  /** glass (the default) over the video, in a drop-up; panel, the panel's light track, in a panel. */
  look?: "glass" | "panel" | undefined;
  children: ReactNode;
}

import type { ReactNode, Ref } from "react";

export interface StageVideoFrameProps {
  /** What it frames: a video, or the words shown while it comes. */
  children: ReactNode;
  /** Its place and any ring of its holder's, drawn on it. */
  className?: string | undefined;
  ref?: Ref<HTMLSpanElement> | undefined;
}

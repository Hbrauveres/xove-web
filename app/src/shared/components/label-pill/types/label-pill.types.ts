import type { ReactNode } from "react";

export interface LabelPillProps {
  /** What leads the words: a face, an icon or a dot; none for words alone ("Only you see this"). */
  lead?: ReactNode;
  children: ReactNode;
  /**
   * Its colours:
   * - glass: over a picture (a preview's name, "Only you see this")
   * - soft: the red tint, red words: a status on a page ("Waiting for approval")
   * - solid: red, deep-red words: a role ("Admin")
   * - quiet: grey, muted words: a status that isn't red news ("Reconnecting")
   */
  tone?: "glass" | "soft" | "solid" | "quiet" | undefined;
  /** s: 22 px, over a picture or in a row; m: on a page, under its text. */
  size?: "s" | "m" | undefined;
  /** Where it sits, set by the piece that places it. */
  className?: string | undefined;
}

import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";
import type { IconName } from "@shared/types/icon.types";

export interface ActionPillProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** xs (26 px) in a panel's row; s (30 px) in a glass row; m (34 px) over a stream and on the empty stage. */
  size: "xs" | "s" | "m";
  /**
   * glass over a stream, red for a call that stands out (Unmute), dark for a small button in a row
   * (the chosen segment's pill: Change, Test), white with dark words while it's on (aria-pressed).
   */
  fill: "glass" | "red" | "dark";
  /** What leads the words: an icon, or the live dot. */
  lead?: IconName | "dot" | undefined;
  /** Can't be used now (it says why in its tooltip): faded, and disabled for assistive tech. */
  unavailable?: boolean | undefined;
  ref?: Ref<HTMLButtonElement> | undefined;
  children: ReactNode;
}

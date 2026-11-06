import type { RefCallback } from "react";

/**
 * The small view's fold, kept by the player: Hide folds it into the corner button, which opens it
 * again. Each element hands itself over, so the move goes from one to the other and the focus follows.
 */
export interface SmallViewFold {
  folded: boolean;
  hide: () => void;
  show: () => void;
  /** The small view's box. */
  setBox: RefCallback<HTMLElement>;
  /** Its Hide button, where the focus comes back. */
  setHide: RefCallback<HTMLElement>;
  /** The corner button it folds into. */
  setCorner: RefCallback<HTMLElement>;
}

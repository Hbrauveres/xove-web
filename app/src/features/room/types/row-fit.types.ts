import type { FoldKey } from "./fold-key.types";

/** How the controls fit a picture this wide. */
export interface RowFit {
  /** The buttons in "…", in the order they folded. */
  folded: FoldKey[];
  /** My own buttons' size: L 48, or M 34 when they don't fit; over someone else's stream, always L. */
  size: "l" | "m";
  /** My own row beside the fullscreen button, when there's no room to centre it. */
  beside: boolean;
}

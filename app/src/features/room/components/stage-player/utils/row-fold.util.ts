import {
  BAR_GAP,
  BAR_TO_FULLSCREEN,
  EDGE,
  FOLD_ORDER,
  ROUND_L,
  ROUND_M,
  OWN_GAP_L,
  OWN_GAP_M,
} from "../constants/row-fold.constants";
import type { FoldKey } from "../../../types/fold-key.types";
import type { RowFit } from "../../../types/row-fit.types";
import type { RowButton, RowItems } from "../types/row-fold.types";

/** A row of buttons, end to end with a gap between each. */
const rowWidth = (widths: number[], gap: number) =>
  widths.reduce((sum, w) => sum + w, 0) + gap * Math.max(0, widths.length - 1);

/** The bar over someone else's stream, with these buttons left and "…" if any folded, and fullscreen. */
function barWidth(buttons: RowButton[], folded: boolean) {
  const widths = buttons.map((b) => b.width);
  return EDGE + rowWidth(folded ? [...widths, ROUND_M] : widths, BAR_GAP) + BAR_TO_FULLSCREEN + ROUND_M + EDGE;
}

/** Over someone else's stream: the bar's buttons fold into "…", a step at a time, until the bar fits. */
function foldBar(picture: number, buttons: RowButton[]): RowFit {
  const folded: FoldKey[] = [];
  let left = buttons;
  for (const step of FOLD_ORDER) {
    if (barWidth(left, folded.length > 0) <= picture) break;
    const here = step.filter((key) => left.some((b) => b.key === key));
    folded.push(...here);
    left = left.filter((b) => !here.some((key) => key === b.key));
  }
  // The bar's buttons are M already: only what folds changes, never my own buttons' size.
  return { folded, size: "l", beside: false };
}

/**
 * Over my own stream nothing folds (a "…" holding only the settings takes the cog's room): my row is
 * centred while it can be, clear of the fullscreen button on both sides; then beside it; then M.
 */
function fitOwn(picture: number, count: number): RowFit {
  for (const [size, button, gap] of [
    ["l", ROUND_L, OWN_GAP_L],
    ["m", ROUND_M, OWN_GAP_M],
  ] as const) {
    const row = rowWidth(Array<number>(count).fill(button), gap);
    // The fullscreen button and the room either side of it: as far from my row as its buttons are apart.
    const corner = gap + ROUND_M + EDGE;
    if (corner + row + corner <= picture) return { folded: [], size, beside: false };
    if (EDGE + row + corner <= picture) return { folded: [], size, beside: true };
  }
  // Too narrow even for M beside it: still beside it, reaching past the picture's left edge, so no
  // button ever lies over the fullscreen button.
  return { folded: [], size: "m", beside: true };
}

/**
 * How the controls fit a picture this wide, in px: which buttons fold into "…", in the order of
 * `FOLD_ORDER`, and my own buttons' size and place. A row that still doesn't fit reaches past the
 * picture, never over the fullscreen button.
 */
export function rowFold(picture: number, items: RowItems): RowFit {
  return "viewer" in items ? foldBar(picture, items.viewer) : fitOwn(picture, items.own);
}

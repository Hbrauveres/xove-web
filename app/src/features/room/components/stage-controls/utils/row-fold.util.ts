import {
  BAR_GAP,
  BAR_TO_FULLSCREEN,
  EDGE,
  FOLD_ORDER,
  L,
  M,
  OWN_GAP_L,
  OWN_GAP_M,
  OWN_TO_FULLSCREEN,
} from "../constants/row-fold.constants";
import type { FoldKey } from "../../../types/fold-key.types";
import type { RowButton, RowFit, RowItems } from "../types/row-fold.types";

/** A row of buttons, end to end with a gap between each. */
const rowWidth = (widths: number[], gap: number) =>
  widths.reduce((sum, w) => sum + w, 0) + gap * Math.max(0, widths.length - 1);

/** The bar over someone else's stream, with these buttons left and "…" if any folded, and fullscreen. */
function barWidth(buttons: RowButton[], folded: boolean) {
  const widths = buttons.map((b) => b.width);
  return EDGE + rowWidth(folded ? [...widths, M] : widths, BAR_GAP) + BAR_TO_FULLSCREEN + M + EDGE;
}

/** Over someone else's stream: the bar's buttons fold into "…", one at a time, until the bar fits. */
function foldBar(picture: number, buttons: RowButton[]): RowFit {
  const folded: FoldKey[] = [];
  let left = buttons;
  for (const key of FOLD_ORDER) {
    if (barWidth(left, folded.length > 0) <= picture) break;
    if (!left.some((b) => b.key === key)) continue;
    folded.push(key);
    left = left.filter((b) => b.key !== key);
  }
  return { folded, size: "m", beside: false };
}

/**
 * Over my own stream nothing folds (a "…" holding only the settings takes the cog's room): my row is
 * centred while it can be, clear of the fullscreen button on both sides; then beside it; then M.
 */
function fitOwn(picture: number, count: number): RowFit {
  for (const [size, button, gap] of [
    ["l", L, OWN_GAP_L],
    ["m", M, OWN_GAP_M],
  ] as const) {
    const row = rowWidth(Array<number>(count).fill(button), gap);
    const corner = OWN_TO_FULLSCREEN + M + EDGE;
    if (row + 2 * corner <= picture) return { folded: [], size, beside: false };
    if (EDGE + row + corner <= picture) return { folded: [], size, beside: true };
  }
  // Too narrow even for M beside it: centred, reaching past the picture equally on both sides.
  return { folded: [], size: "m", beside: false };
}

/**
 * How the controls fit a picture this wide, in px: which buttons fold into "…", in the order of
 * `FOLD_ORDER`, and my own buttons' size and place. A row that still doesn't fit reaches past the
 * picture equally on both sides.
 */
export function rowFold(picture: number, items: RowItems): RowFit {
  return "viewer" in items ? foldBar(picture, items.viewer) : fitOwn(picture, items.own);
}

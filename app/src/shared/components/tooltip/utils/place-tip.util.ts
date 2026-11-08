import { EDGE, GAP, HALF } from "../constants/tooltip.constants";
import type { TipSide } from "../types/tooltip.types";

/**
 * Above its control, centred, within the window; below it where there's no room above. Beside: to
 * the right of its control, centred on it, or to its left where the window has no room (a list's
 * option, so it never covers what's above it).
 */
export function placeTip(
  control: DOMRect,
  { width, height }: { width: number; height: number },
  windowWidth: number,
  side: TipSide = "above",
) {
  if (side === "beside") {
    const right = control.right + GAP;
    return {
      left: right + width <= windowWidth - EDGE ? right : Math.max(EDGE, control.left - GAP - width),
      top: control.top + control.height * HALF - height * HALF,
    };
  }
  const centred = control.left + control.width * HALF - width * HALF;
  const top = control.top - GAP - height;
  return {
    left: Math.min(Math.max(EDGE, centred), windowWidth - EDGE - width),
    top: top >= EDGE ? top : control.bottom + GAP,
  };
}

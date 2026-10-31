import { EDGE, GAP, HALF } from "../constants/tooltip.constants";

/** Above its control, centred, within the window; below it where there's no room above. */
export function placeTip(control: DOMRect, width: number, height: number, windowWidth: number) {
  const centred = control.left + control.width * HALF - width * HALF;
  const top = control.top - GAP - height;
  return {
    left: Math.min(Math.max(EDGE, centred), windowWidth - EDGE - width),
    top: top >= EDGE ? top : control.bottom + GAP,
  };
}

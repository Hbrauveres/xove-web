import { EDGES, SHIFT_X, SHIFT_Y } from "../constants/pointer-shift.constants";

/** Where the scene goes for a pointer over the stage: away from it, the most at the stage's edges. */
export function pointerShift(x: number, y: number, box: Pick<DOMRect, "left" | "top" | "width" | "height">) {
  if (!box.width || !box.height) return { x: 0, y: 0 };
  // From -1 at the stage's left (or top) edge to 1 at its right (or bottom).
  const across = ((x - box.left) / box.width) * EDGES - 1;
  const down = ((y - box.top) / box.height) * EDGES - 1;
  // + 0 turns -0 into 0, so a centred pointer reads as no shift.
  return { x: -across * SHIFT_X + 0, y: -down * SHIFT_Y + 0 };
}

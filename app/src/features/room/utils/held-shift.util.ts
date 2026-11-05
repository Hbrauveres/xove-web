/** The row's offset after the button under the pointer moved from `before` to `now` (px). */
export function heldShift(shift: number, before: number, now: number): number {
  return shift + (before - now);
}

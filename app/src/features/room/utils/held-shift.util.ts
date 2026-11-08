/** The group's offset along one axis after the part under the pointer moved from `before` to `now` (px). */
export function heldShift(shift: number, before: number, now: number): number {
  return shift + (before - now);
}

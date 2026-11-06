/** Whether a pointer is strictly inside a box (a "left" sent from inside it is a browser's mistake). */
export function pointerInside(at: { clientX: number; clientY: number }, box: DOMRect): boolean {
  return at.clientX > box.left && at.clientX < box.right && at.clientY > box.top && at.clientY < box.bottom;
}

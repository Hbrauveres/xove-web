/**
 * Where a preview's picture sits in its slot, by layout: its slot's box (`anchor`, which never
 * animates) plus the picture's place and size in it, leaving out what animates it (a swap's bounce
 * moves and scales the picture, never its slot).
 */
export function slotBox(anchor: HTMLElement, picture: HTMLElement): DOMRect {
  const slot = anchor.getBoundingClientRect();
  return new DOMRect(
    slot.x + picture.offsetLeft,
    slot.y + picture.offsetTop,
    picture.offsetWidth,
    picture.offsetHeight,
  );
}

import { FADE_GAP, FADE_LATE, FADE_MIDDLE, FADE_PX } from "../constants/picker.constants";

/** Whether an element is under the list, or under the fade just below it. */
export function isUnderList(box: DOMRect, list: DOMRect) {
  const horizontally = box.right > list.left && box.left < list.right;
  return horizontally && box.bottom > list.top && box.top < list.bottom + FADE_GAP + FADE_PX;
}

/** Hides what's right behind the list; what's just under it comes back over the fade. */
export function listMask(box: DOMRect, list: DOMRect) {
  const top = list.top - box.top;
  const bottom = list.bottom - box.top + FADE_GAP;
  const stops = [
    `#000 ${top}px`,
    `transparent ${top}px`,
    `transparent ${bottom}px`,
    `rgba(0, 0, 0, 0.08) ${bottom + FADE_PX * FADE_MIDDLE}px`,
    `rgba(0, 0, 0, 0.35) ${bottom + FADE_PX * FADE_LATE}px`,
    `#000 ${bottom + FADE_PX}px`,
  ];
  return `linear-gradient(to bottom, ${stops.join(", ")})`;
}

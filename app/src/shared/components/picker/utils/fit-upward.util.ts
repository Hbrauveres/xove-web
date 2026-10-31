import { CLIP_ROOM } from "../constants/picker.constants";

function clipperOf(el: Element | null) {
  let clip = el;
  while (clip && getComputedStyle(clip).overflow === "visible" && getComputedStyle(clip).overflowY === "visible")
    clip = clip.parentElement;
  return clip;
}

/** An upward list: no taller than the room above it, up to whatever clips it, at the pill's end. */
export function fitUpward(list: HTMLElement, picker: HTMLElement | null) {
  const top = clipperOf(picker?.parentElement ?? null)?.getBoundingClientRect().top ?? 0;
  const room = (picker?.getBoundingClientRect().top ?? 0) - top - CLIP_ROOM;
  list.style.maxHeight = room > 0 ? `min(${Math.floor(room)}px, calc(var(--ctl, 38px) * 3.5))` : "";
  // The nearest option whole, the half-shown one at the top.
  list.scrollTop = list.scrollHeight;
}

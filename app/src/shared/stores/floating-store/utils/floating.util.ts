import type { Floating } from "../types/floating.types";

/** What takes the focus back: the anchor, or the button inside its wrapper. */
export function buttonIn(anchor: HTMLElement | null | undefined) {
  return anchor?.querySelector<HTMLElement>("button") ?? anchor;
}

/** Whether `inner` shows inside `outer`, by its button or its own area. */
export function belongsTo(inner: Floating, outer: Floating) {
  const area = outer.area();
  const [anchor, own] = [inner.anchor?.(), inner.area()];
  // Also what shows over its button: a preview's tooltip belongs to the row that preview opened.
  if (anchor && outer.anchor?.()?.contains(anchor)) return true;
  return Boolean(area && ((anchor && area.contains(anchor)) || (own && area.contains(own))));
}

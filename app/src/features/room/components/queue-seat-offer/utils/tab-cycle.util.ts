import { tabbables } from "../../../utils/tabbables.util";

/**
 * Where Tab goes from the focused element so it never leaves `root`: from its last stop back to
 * its first, and with Shift from its first to its last; undefined when the browser's own step stays inside.
 */
export function tabCycle(root: HTMLElement, focused: Element | null, back: boolean): HTMLElement | undefined {
  const stops = tabbables(root);
  const first = stops[0];
  const last = stops.at(-1);
  if (back && focused === first) return last;
  if (!back && focused === last) return first;
  return undefined;
}

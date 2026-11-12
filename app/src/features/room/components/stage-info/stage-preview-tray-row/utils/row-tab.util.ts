import { tabbableAfter, tabbables } from "../../../../utils/tabbables.util";

/**
 * Where Tab goes from inside a row: Shift+Tab from its first stop back to its preview, Tab from its
 * last stop on to whatever follows the preview. Anything else: nowhere of its own (undefined).
 */
export function rowTab(target: EventTarget, back: boolean, row: HTMLElement, preview: HTMLElement) {
  const stops = tabbables(row);
  if (back) return target === stops[0] ? tabbables(preview)[0] : undefined;
  return target === stops.at(-1) ? tabbableAfter(preview, row) : undefined;
}

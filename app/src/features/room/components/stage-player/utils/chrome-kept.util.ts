import type { ChromeReasons } from "../types/stage-chrome.types";
/**
 * Whether the controls stay up: something holds them, the pointer rests on one, a control's menu is
 * open in `frame` (Go live's, "…"'s), or a control in it has the keyboard's focus.
 */
export function chromeKept(frame: HTMLElement | null, { held, onControl, keyboard }: ChromeReasons): boolean {
  if (held > 0 || onControl) return true;
  if (frame?.querySelector('[aria-expanded="true"]')) return true;
  return keyboard && (frame?.contains(document.activeElement) ?? false);
}

/** What may keep the player's controls up, beside the player itself. */
export interface ChromeReasons {
  /** How many things hold them up (a menu, the settings). */
  held: number;
  /** The pointer rests on one of the controls. */
  onControl: boolean;
  /** The keyboard was used last (a click's focus doesn't count). */
  keyboard: boolean;
}

/**
 * Whether the controls stay up: something holds them, the pointer rests on one, a control's menu is
 * open in `frame` (Go live's, "…"'s), or a control in it has the keyboard's focus.
 */
export function chromeKept(frame: HTMLElement | null, { held, onControl, keyboard }: ChromeReasons): boolean {
  if (held > 0 || onControl) return true;
  if (frame?.querySelector('[aria-expanded="true"]')) return true;
  return keyboard && (frame?.contains(document.activeElement) ?? false);
}

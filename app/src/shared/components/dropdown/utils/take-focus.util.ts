/** A panel opening takes the focus: a menu's first item, what's marked to take it, or the panel itself. */
export function takeFocus(panel: HTMLElement | null, role: string) {
  const first = panel?.querySelector<HTMLElement>(role === "menu" ? "[role^=menuitem]" : "[data-autofocus]");
  (first ?? panel)?.focus();
}

import { useCallback, useLayoutEffect, useRef, type FocusEvent } from "react";

/**
 * The panel's focus going back: what had it when the panel opened (the cog) gets it again when the
 * panel closes, if it was inside. Remembered before the tabs take it (a layout effect runs first).
 */
export function usePanelFocus(open: boolean) {
  const opener = useRef<HTMLElement | null>(null);
  const inside = useRef(false);
  useLayoutEffect(() => {
    if (open) {
      opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      return;
    }
    if (inside.current) opener.current?.focus();
    inside.current = false;
  }, [open]);
  const onFocus = useCallback(() => {
    inside.current = true;
  }, []);
  const onBlur = useCallback((e: FocusEvent<HTMLElement>) => {
    inside.current = e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget);
  }, []);
  return { onFocus, onBlur };
}

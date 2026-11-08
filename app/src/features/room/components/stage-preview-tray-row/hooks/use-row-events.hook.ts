import { useEffect, useRef, type RefObject } from "react";
import type { OpenRow } from "../../../types/preview-tray.types";
import type { RowHandlers } from "../types/stage-preview-tray-row.types";
import { rowTab } from "../utils/row-tab.util";

/**
 * What a row listens to: the pointer coming and going (a mouse leaving lets it go), the focus
 * coming in and leaving it for anywhere but its preview, Tab at either end (back to its preview, or
 * on past it), and its roll-back ending.
 */
export function useRowEvents(element: RefObject<HTMLElement | null>, open: OpenRow, handlers: RowHandlers) {
  const latest = useRef(handlers);
  useEffect(() => {
    latest.current = handlers;
  });
  useEffect(() => {
    const el = element.current;
    if (!el) return;
    const enter = () => latest.current.onEnter();
    const pointerLeave = (e: PointerEvent) => e.pointerType === "mouse" && latest.current.onLeave();
    const focusOut = (e: FocusEvent) => {
      const to = e.relatedTarget instanceof Node ? e.relatedTarget : null;
      if (!to || (!el.contains(to) && !open.anchor.contains(to))) latest.current.onLeave();
    };
    const key = (e: KeyboardEvent) => {
      const to = e.key === "Tab" && e.target ? rowTab(e.target, e.shiftKey, el, open.anchor) : undefined;
      if (!to) return;
      e.preventDefault();
      to.focus();
    };
    // The roll back is the row's own clip (on the glass inside this holder).
    const ended = (e: TransitionEvent) =>
      e.target instanceof Element &&
      e.target.parentElement === el &&
      e.propertyName === "clip-path" &&
      latest.current.onRolledBack();
    const listening = new AbortController();
    const { signal } = listening;
    el.addEventListener("pointerenter", enter, { signal });
    el.addEventListener("pointerleave", pointerLeave, { signal });
    el.addEventListener("focusin", enter, { signal });
    el.addEventListener("focusout", focusOut, { signal });
    el.addEventListener("keydown", key, { signal });
    el.addEventListener("transitionend", ended, { signal });
    return () => listening.abort();
  }, [element, open]);
}

import { useEffect, useRef, useState, type FocusEvent } from "react";
import { LEAVE_GRACE_MS, OPEN_DELAY_MS } from "@shared/constants/floating.constants";
import { floatingStore, useFloating } from "@shared/stores/floating-store";
import type { DropUpOptions } from "../types/drop-up.types";
import { isKeyboardFocus } from "../utils/keyboard-focus.util";

/** When a drop-up is open: the mouse's rest and grace, the keyboard's focus, what closes it. */
export function useDropUp({ enabled, open: told, onOpenChange, redirect }: DropUpOptions) {
  const [own, setOwn] = useState(false);
  const open = told ?? own;
  const setOpen = (next: boolean) => {
    if (told === undefined) setOwn(next);
    onOpenChange?.(next);
  };
  const opening = useRef<number | undefined>(undefined);
  const leaving = useRef<number | undefined>(undefined);
  const root = useRef<HTMLDivElement>(null);
  const clear = () => {
    window.clearTimeout(opening.current);
    window.clearTimeout(leaving.current);
  };
  useEffect(() => clear, []);

  const close = () => {
    clear();
    setOpen(false);
  };
  const floating = useFloating({
    open,
    kind: "rest",
    close,
    area: () => root.current,
    anchor: () => root.current?.querySelector<HTMLElement>("[data-dropup-trigger]") ?? null,
  });
  // The stream stopped: closed.
  useEffect(() => {
    if (!enabled) floating.close();
  }, [enabled, floating]);
  /** Whether it may open now: never over what the person opened themselves. */
  const free = () => floatingStore.canRest(root.current);
  const closeOthers = () => floatingStore.clearForRest(floating.close, root.current);

  const handlers = {
    onPointerEnter: () => {
      window.clearTimeout(leaving.current);
      if (open || !free()) return;
      closeOthers();
      opening.current = window.setTimeout(() => {
        if (redirect) redirect();
        else if (free()) setOpen(true);
      }, OPEN_DELAY_MS);
    },
    onPointerLeave: () => {
      window.clearTimeout(opening.current);
      leaving.current = window.setTimeout(close, LEAVE_GRACE_MS);
    },
    onFocus: (e: FocusEvent) => {
      // Redirected, the keyboard reaches the panel itself: tabbing past the button moves nothing.
      if (isKeyboardFocus(e.target) && !redirect && free()) {
        closeOthers();
        setOpen(true);
      }
    },
    onBlur: (e: FocusEvent) => {
      const to = e.relatedTarget instanceof Node ? e.relatedTarget : null;
      if (!root.current?.contains(to) && !root.current?.matches(":hover")) setOpen(false);
    },
  };
  return { open, root, handlers };
}

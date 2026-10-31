import { useEffect, useRef, useState, type CSSProperties, type FocusEvent } from "react";
import { floatingStore, useFloating } from "@shared/stores/floating-store";
import { LEAVE_GRACE_MS, OPEN_DELAY_MS } from "@shared/constants/floating.constants";
import styles from "./drop-up.component.module.css";
import type { DropUpProps } from "./types/drop-up.types";

/**
 * Quick access over a live round button: resting the mouse on the button unrolls one frosted
 * pill above it, centred, after a short pause; moving up into it keeps it open (the gap is
 * bridged); leaving closes it, even right after a click, with a short grace for a slip. The
 * keyboard's focus opens it too. A click still does what the button does. Nothing unrolls over what
 * the person opened themselves (a panel). Nothing unrolls over what
 * the person opened themselves (a panel).
 */
export function DropUp({ label, enabled, trigger, open: told, onOpenChange, width, redirect, children }: DropUpProps) {
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

  // The stream stopped: closed.
  const [wasEnabled, setWasEnabled] = useState(enabled);
  if (enabled !== wasEnabled) {
    setWasEnabled(enabled);
    if (open) setOpen(false);
  }

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
  /** Whether it may open now: never over what the person opened themselves. */
  const free = () => floatingStore.canRest(root.current);
  const closeOthers = () => floatingStore.clearForRest(floating.close, root.current);

  // ---- the mouse
  const onPointerEnter = () => {
    window.clearTimeout(leaving.current);
    if (open || !free()) return;
    closeOthers();
    opening.current = window.setTimeout(() => {
      if (redirect) redirect();
      else if (free()) setOpen(true);
    }, OPEN_DELAY_MS);
  };
  const onPointerLeave = () => {
    window.clearTimeout(opening.current);
    leaving.current = window.setTimeout(close, LEAVE_GRACE_MS);
  };

  // ---- the keyboard: only its focus opens it; a click's focus doesn't keep it open
  const onFocus = (e: FocusEvent) => {
    let keyboard = false;
    try {
      keyboard = (e.target as Element).matches(":focus-visible");
    } catch {
      keyboard = false;
    }
    // Redirected, the keyboard reaches the panel itself: tabbing past the button moves nothing.
    if (keyboard && !redirect && free()) {
      closeOthers();
      setOpen(true);
    }
  };
  const onBlur = (e: FocusEvent) => {
    if (!root.current?.contains(e.relatedTarget as Node | null) && !root.current?.matches(":hover")) setOpen(false);
  };

  // Always the same wrapper around the button, so it keeps the keyboard's focus when its
  // stream starts or stops; only the drop-up and its handlers come and go.
  if (!enabled) {
    return (
      <div className={styles.wrap}>
        <div className={styles.trigger} data-dropup-trigger>
          {trigger}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={root}
      className={styles.wrap}
      data-dropup
      data-open={open}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      <div className={styles.trigger} data-dropup-trigger>
        {trigger}
      </div>
      <div
        className={styles.dropup}
        role="group"
        aria-label={label}
        inert={!open || undefined}
        style={width ? ({ "--dropup-width": `${width}px` } as CSSProperties) : undefined}
      >
        {children}
      </div>
    </div>
  );
}

import { useCallback, useEffect, useRef, type RefCallback } from "react";
import { RECENTRE_EASE, RECENTRE_MS, STILL_PX } from "../constants/pinned-row.constants";
import { heldShift } from "../utils/held-shift.util";

/**
 * Keeps the button under the pointer still whenever the row changes width: a
 * button coming or going, a live stream's arrow appearing or going on the click itself.
 * The row is watched with a ResizeObserver, which reports a change after layout and before
 * paint, so the row moves back by however far the button was pushed in the same frame, and
 * on every frame of a 220 ms slot animation. Once the pointer leaves the row, it glides back
 * to the centre. Without the pointer on the row, nothing is held.
 */
export function usePinnedRow<T extends HTMLElement>(onElement?: RefCallback<T>) {
  const node = useRef<T | null>(null);
  // Its element, handed on too (the settings sit just above this row).
  const ref = useCallback(
    (el: T | null) => {
      node.current = el;
      onElement?.(el);
    },
    [onElement],
  );

  useEffect(() => {
    const row = node.current;
    if (!row) return;
    let shift = 0;
    let anchor: HTMLElement | null = null;
    // Where the button under the pointer sits while it rests there.
    let rest = 0;

    const apply = (animate: boolean) => {
      row.style.transition = animate ? `transform ${RECENTRE_MS}ms ${RECENTRE_EASE}` : "none";
      row.style.transform = shift ? `translateX(${shift}px)` : "";
    };
    const over = (e: PointerEvent) => {
      const button = e.target instanceof Element ? e.target.closest("button") : null;
      if (!button || button === anchor) return;
      anchor = button;
      rest = button.getBoundingClientRect().left;
    };
    const leave = () => {
      anchor = null;
      if (shift !== 0) {
        shift = 0;
        apply(true);
      }
    };
    const resized = () => {
      if (!anchor || !anchor.isConnected) return;
      const now = anchor.getBoundingClientRect().left;
      if (Math.abs(now - rest) < STILL_PX) return;
      shift = heldShift(shift, rest, now);
      apply(false);
    };

    row.addEventListener("pointerover", over);
    row.addEventListener("pointerleave", leave);
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resized);
    observer?.observe(row);
    return () => {
      row.removeEventListener("pointerover", over);
      row.removeEventListener("pointerleave", leave);
      observer?.disconnect();
    };
  }, []);

  return { ref };
}

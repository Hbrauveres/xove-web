import { useEffect, useRef } from "react";

/** Further than this, a finger is dragging (a swipe), not tapping. */
const TAP_SLOP = 10;
/** Longer than this, a finger is holding, not tapping. */
const TAP_MS = 500;

type Press = { pointerType: string; clientX: number; clientY: number; timeStamp: number; target: EventTarget | null };

const onControl = (e: Press) =>
  Boolean((e.target as Element | null)?.closest?.('button, input, a, label, [role="dialog"]'));

/**
 * The player's controls on a touch screen (spec 0131, design decision 16): a finger's tap on empty
 * space shows them, or hides them if they're shown, always the same. A drag is a swipe and only
 * shows them; a press on a control only keeps them (buttons are only buttons). A mouse shows them
 * on any move or press, as before.
 */
export function useTapToggle({ shown, onShow, onHide }: { shown: boolean; onShow: () => void; onHide: () => void }) {
  const tap = useRef<{ x: number; y: number; at: number; shown: boolean } | null>(null);
  return {
    down(e: Press) {
      if (e.pointerType === "touch" && !onControl(e))
        tap.current = { x: e.clientX, y: e.clientY, at: e.timeStamp, shown };
      else onShow();
    },
    move(e: Press) {
      const t = tap.current;
      if (e.pointerType !== "touch") onShow();
      else if (t && Math.hypot(e.clientX - t.x, e.clientY - t.y) > TAP_SLOP) {
        tap.current = null;
        onShow();
      }
    },
    up(e: Press) {
      const t = tap.current;
      tap.current = null;
      if (!t || e.timeStamp - t.at >= TAP_MS) return;
      if (t.shown) onHide();
      else onShow();
    },
    cancel() {
      tap.current = null;
    },
  };
}

/**
 * Whether the keyboard, not a press, came last (spec 0131): the keyboard's focus keeps the controls
 * up, but a finger's tap leaves focus on the button it pressed, and that mustn't keep them for good.
 */
export function useKeyboardLast() {
  const pressed = useRef(false);
  useEffect(() => {
    const press = () => (pressed.current = true);
    const key = () => (pressed.current = false);
    document.addEventListener("pointerdown", press, true);
    document.addEventListener("keydown", key, true);
    return () => {
      document.removeEventListener("pointerdown", press, true);
      document.removeEventListener("keydown", key, true);
    };
  }, []);
  return () => !pressed.current;
}

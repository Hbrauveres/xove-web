import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent, type RefObject } from "react";
import { useKeyboardLast } from "../../../../hooks/use-keyboard-last.hook";
import { CHROME_IDLE_MS, HOLD_MENU, RESTS_ON } from "../constants/stage-player.constants";
import type { StageChrome } from "../types/stage-chrome.types";
import { chromeKept } from "../utils/chrome-kept.util";
import { pointerInside } from "../utils/pointer-inside.util";

/**
 * The player's labels and bars, like YouTube's: shown while the mouse moves over `frame`, faded
 * 2.5 s after it stops. Nothing fades while the pointer rests on a control, a control in it has the
 * keyboard's focus or its menu open, or something holds them up; a click's focus doesn't count.
 */
export function useStageChrome(frame: RefObject<HTMLElement | null>): StageChrome {
  const [shown, setShown] = useState(false);
  const idle = useRef<number | undefined>(undefined);
  const held = useRef(new Set<string>());
  // Whether the pointer rests on one of the controls: they never fade from under it.
  const onControl = useRef(false);
  const keyboardFocus = useKeyboardLast();
  const kept = useCallback(
    () =>
      chromeKept(frame.current, { held: held.current.size, onControl: onControl.current, keyboard: keyboardFocus() }),
    [frame, keyboardFocus],
  );

  const show = useCallback(() => {
    setShown(true);
    window.clearTimeout(idle.current);
    const fade = () => {
      if (kept()) idle.current = window.setTimeout(fade, CHROME_IDLE_MS);
      else setShown(false);
    };
    idle.current = window.setTimeout(fade, CHROME_IDLE_MS);
  }, [kept]);

  const leave = useCallback(
    (e: PointerEvent) => {
      const el = frame.current;
      // Fullscreen there's nothing outside the player to leave to: some browsers still send "left"
      // while the mouse moves over it (Chrome on Windows, on a tall monitor). Only the idle timer
      // hides them there; and a "left" while the pointer is still over the player is ignored too.
      if (!el || !pointerInside(e, el.getBoundingClientRect())) onControl.current = false;
      if (kept() || !el || document.fullscreenElement === el || pointerInside(e, el.getBoundingClientRect())) return;
      window.clearTimeout(idle.current);
      setShown(false);
    },
    [frame, kept],
  );

  const hold = useCallback(
    (what: string, open: boolean) => {
      if (!open) {
        held.current.delete(what);
        return;
      }
      held.current.add(what);
      show();
    },
    [show],
  );

  /** One of my buttons' menus opened or closed: it holds the controls up while open. */
  const onMenuChange = useCallback((open: boolean) => hold(HOLD_MENU, open), [hold]);

  const over = useCallback((e: PointerEvent) => {
    onControl.current = e.target instanceof Element && e.target.closest(RESTS_ON) !== null;
  }, []);

  useEffect(() => () => window.clearTimeout(idle.current), []);
  return useMemo(
    () => ({
      shown,
      show,
      leave,
      hold,
      onMenuChange,
      handlers: { onPointerMove: show, onPointerDown: show, onFocus: show, onPointerLeave: leave, onPointerOver: over },
    }),
    [shown, show, leave, hold, onMenuChange, over],
  );
}

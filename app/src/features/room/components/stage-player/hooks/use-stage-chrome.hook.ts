import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent, type RefObject } from "react";
import { useKeyboardLast } from "../../../hooks/use-keyboard-last.hook";
import { CHROME_IDLE_MS } from "../constants/stage-player.constants";
import type { StageChrome } from "../types/stage-chrome.types";
import { pointerInside } from "../utils/pointer-inside.util";

/**
 * The player's labels and bars, like YouTube's: shown while the mouse moves over `frame`, faded
 * 2.5 s after it stops. Nothing fades while a control in it has the keyboard's focus, or something
 * holds them up; a click's focus doesn't count.
 */
export function useStageChrome(frame: RefObject<HTMLElement | null>): StageChrome {
  const [shown, setShown] = useState(false);
  const idle = useRef<number | undefined>(undefined);
  const held = useRef(new Set<string>());
  const keyboardFocus = useKeyboardLast();
  const kept = useCallback(
    () => held.current.size > 0 || (keyboardFocus() && (frame.current?.contains(document.activeElement) ?? false)),
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

  useEffect(() => () => window.clearTimeout(idle.current), []);
  return useMemo(
    () => ({
      shown,
      show,
      leave,
      hold,
      handlers: { onPointerMove: show, onPointerDown: show, onFocus: show, onPointerLeave: leave },
    }),
    [shown, show, leave, hold],
  );
}

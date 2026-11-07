import { useEffect, useMemo, useRef } from "react";
import { IDLE_MS, LEAVE_MS, REST_MS } from "../constants/sound-slider.constants";
import type { SliderTimer } from "../types/sound.types";

/**
 * When a sound's slider opens and closes: it opens once the mouse rests on its button; it closes a
 * while after the mouse leaves (where leaving closes it), or once it's been untouched for a while.
 * `close` is called by the timers; the functions it hands back stay the same every render.
 */
export function useHoldOrRest(close: () => void) {
  const closing = useRef(close);
  useEffect(() => {
    closing.current = close;
  });
  const timers = useRef<Partial<Record<SliderTimer, number>>>({});
  useEffect(() => {
    const running = timers.current;
    return () => Object.values(running).forEach((t) => window.clearTimeout(t));
  }, []);
  return useMemo(() => {
    const stop = (timer: SliderTimer) => window.clearTimeout(timers.current[timer]);
    const after = (timer: SliderTimer, ms: number, then: () => void) => {
      stop(timer);
      timers.current[timer] = window.setTimeout(then, ms);
    };
    /** Starts the untouched wait again: the slider was just opened, moved or clicked. */
    const touch = () => after("idle", IDLE_MS, () => closing.current());
    return {
      touch,
      /** The mouse rests on the button: `open` once it has rested long enough. */
      rest: (open: () => void) => {
        stop("leave");
        after("rest", REST_MS, () => {
          open();
          touch();
        });
      },
      /** The mouse leaves: no opening; with `closes`, the slider closes a little later. */
      leave: (closes: boolean) => {
        stop("rest");
        if (closes) after("leave", LEAVE_MS, () => closing.current());
      },
    };
  }, []);
}

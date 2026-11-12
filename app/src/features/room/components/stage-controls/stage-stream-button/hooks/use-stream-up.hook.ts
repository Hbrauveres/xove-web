import { useCallback, useMemo, useState } from "react";

/**
 * A stream button's drop-up: open while resting on it; what's done from it (Change, a camera picked)
 * closes it. The camera's list closes when its drop-up does; the player is told while the list is open.
 */
export function useStreamUp(onMenuChange?: (open: boolean) => void) {
  const [upOpen, setUpOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const onUpOpen = useCallback((open: boolean) => {
    setUpOpen(open);
    if (!open) setListOpen(false);
  }, []);
  const onListOpen = useCallback(
    (open: boolean) => {
      setListOpen(open);
      onMenuChange?.(open);
    },
    [onMenuChange],
  );
  /** Something was done from it: it closes, then the thing happens. */
  const done = useCallback(
    <A extends unknown[]>(then: (...a: A) => void) =>
      (...a: A) => {
        setUpOpen(false);
        then(...a);
      },
    [],
  );
  return useMemo(
    () => ({ upOpen, listOpen, onUpOpen, onListOpen, done }),
    [upOpen, listOpen, onUpOpen, onListOpen, done],
  );
}

import { useCallback, useEffect, useRef } from "react";

/**
 * The tabs' buttons and their focus: `refOf` gives each its ref, `focusOn` moves the focus to one,
 * and while `focused` turns true the chosen one takes it, without scrolling (its holder may still
 * be coming in).
 */
export function useTabFocus<K extends string>(chosen: K, focused: boolean) {
  const buttons = useRef(new Map<K, HTMLButtonElement>());
  const chosenNow = useRef(chosen);
  useEffect(() => {
    chosenNow.current = chosen;
  });
  const refOf = useCallback(
    (key: K) => (el: HTMLButtonElement | null) => {
      if (el) buttons.current.set(key, el);
      else buttons.current.delete(key);
    },
    [],
  );
  const focusOn = useCallback((key: K) => buttons.current.get(key)?.focus(), []);
  useEffect(() => {
    if (focused) buttons.current.get(chosenNow.current)?.focus({ preventScroll: true });
  }, [focused]);
  return { refOf, focusOn };
}

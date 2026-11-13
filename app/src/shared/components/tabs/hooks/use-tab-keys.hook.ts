import { useCallback, useRef, type KeyboardEvent } from "react";
import { TAB_STEPS } from "../constants/tabs.constants";

/**
 * The tabs' keys: the arrows choose the next usable tab, round the ends, and move the focus to it,
 * so the tabs take one stop of the Tab key. `refOf` gives each tab's button its ref.
 */
export function useTabKeys<K extends string>(usable: K[], chosen: K, onChoose: (key: K) => void) {
  const buttons = useRef(new Map<K, HTMLButtonElement>());
  const refOf = useCallback(
    (key: K) => (el: HTMLButtonElement | null) => {
      if (el) buttons.current.set(key, el);
      else buttons.current.delete(key);
    },
    [],
  );
  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const step = TAB_STEPS[e.key];
      const at = usable.indexOf(chosen);
      const next = usable[(at + (step ?? 0) + usable.length) % usable.length];
      if (!step || next === undefined || next === chosen) return;
      e.preventDefault();
      onChoose(next);
      buttons.current.get(next)?.focus();
    },
    [usable, chosen, onChoose],
  );
  return { onKeyDown, refOf };
}

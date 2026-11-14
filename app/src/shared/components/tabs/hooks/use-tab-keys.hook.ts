import { useCallback, type KeyboardEvent } from "react";
import { TAB_STEPS } from "../constants/tabs.constants";

/**
 * The tabs' keys: the arrows choose the next usable tab, round the ends, and move the focus to it,
 * so the tabs take one stop of the Tab key.
 */
export function useTabKeys<K extends string>(
  usable: K[],
  chosen: K,
  onChoose: (key: K) => void,
  focusOn: (key: K) => void,
) {
  return useCallback(
    (e: KeyboardEvent) => {
      const step = TAB_STEPS[e.key];
      const next = usable[(usable.indexOf(chosen) + (step ?? 0) + usable.length) % usable.length];
      if (!step || next === undefined || next === chosen) return;
      e.preventDefault();
      onChoose(next);
      focusOn(next);
    },
    [usable, chosen, onChoose, focusOn],
  );
}

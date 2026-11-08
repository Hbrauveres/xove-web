import { useCallback, useEffect, useRef, type RefCallback } from "react";
import { holdGroup } from "../utils/hold-group.util";

/**
 * A group that never moves under the pointer (`holdGroup`): its ref, handed on to `onElement` too
 * (the settings sit just above my row); `watch` names what else may push it.
 */
export function useHeldGroup<T extends HTMLElement>(onElement?: RefCallback<T>, watch?: () => Element[]) {
  const node = useRef<T | null>(null);
  const ref = useCallback(
    (el: T | null) => {
      node.current = el;
      onElement?.(el);
    },
    [onElement],
  );
  const watched = useRef(watch);
  useEffect(() => {
    watched.current = watch;
  });
  useEffect(() => {
    const group = node.current;
    return group ? holdGroup(group, watched.current?.() ?? []) : undefined;
  }, []);
  return { ref };
}

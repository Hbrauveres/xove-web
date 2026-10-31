import { useCallback, type Ref, type RefObject } from "react";
import { assignRef } from "../utils/assign-ref.util";

/** One ref that fills both: the tooltip's own, and the one its control already had. */
export function useBothRefs(mine: RefObject<HTMLElement | null>, theirs: Ref<HTMLElement> | undefined) {
  return useCallback(
    (el: HTMLElement | null) => {
      assignRef(mine, el);
      assignRef(theirs, el);
    },
    [mine, theirs],
  );
}

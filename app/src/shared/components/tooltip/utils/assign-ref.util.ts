import type { Ref } from "react";

/** Hands an element to a ref of either kind. */
export function assignRef<T>(ref: Ref<T> | undefined, el: T | null) {
  if (typeof ref === "function") ref(el);
  else if (ref) ref.current = el;
}

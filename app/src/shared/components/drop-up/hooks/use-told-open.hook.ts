import { useState } from "react";

/** Open as its owner tells it, or by itself when nobody does; every change is told back. */
export function useToldOpen(told: boolean | undefined, onOpenChange: ((open: boolean) => void) | undefined) {
  const [own, setOwn] = useState(false);
  const open = told ?? own;
  const setOpen = (next: boolean) => {
    if (told === undefined) setOwn(next);
    onOpenChange?.(next);
  };
  return [open, setOpen] as const;
}

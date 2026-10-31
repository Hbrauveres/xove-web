import { useEffect, useRef, useState } from "react";

/**
 * Open or closed, told from outside or kept here. Tells whoever listens each time it opens or closes,
 * however it happened (its drop-up left, a press outside), and that it's closed when it goes away open.
 */
export function useToldOpen(told: boolean | undefined, onOpenChange: ((open: boolean) => void) | undefined) {
  const [own, setOwn] = useState(false);
  const open = told ?? own;
  const setOpen = (next: boolean) => (told === undefined ? setOwn(next) : onOpenChange?.(next));
  const said = useRef(false);
  const tell = useRef(onOpenChange);
  useEffect(() => {
    tell.current = onOpenChange;
  });
  useEffect(() => {
    if (open === said.current) return;
    said.current = open;
    tell.current?.(open);
  }, [open]);
  useEffect(
    () => () => {
      if (said.current) tell.current?.(false);
      said.current = false;
    },
    [],
  );
  return { open, setOpen };
}

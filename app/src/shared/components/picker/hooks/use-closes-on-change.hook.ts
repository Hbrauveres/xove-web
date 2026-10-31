import { useEffect, useRef } from "react";

/** What the masks were measured against changes (the window, the list of options): it closes. */
export function useClosesOnChange(close: () => void, optionsKey: string, open: boolean) {
  const was = useRef(optionsKey);
  useEffect(() => {
    if (was.current === optionsKey) return;
    was.current = optionsKey;
    close();
  }, [optionsKey, close]);
  useEffect(() => {
    if (!open) return;
    window.addEventListener("resize", close);
    return () => window.removeEventListener("resize", close);
  }, [open, close]);
}

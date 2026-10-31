import { useEffect, useRef, useState } from "react";
import { floatingStore } from "../floating.store";
import type { Floating, UseFloatingOptions } from "../types/floating.types";

/** Tells the floating store this piece floats while `open`, and lets the store close it. */
export function useFloating({ open, kind, close, area, anchor }: UseFloatingOptions) {
  const latest = useRef({ close, area, anchor });
  useEffect(() => {
    latest.current = { close, area, anchor };
  });
  const [floating] = useState<Floating>(() => ({
    kind,
    close: () => latest.current.close(),
    area: () => latest.current.area(),
    anchor: () => latest.current.anchor?.() ?? null,
  }));
  useEffect(() => {
    if (!open) return;
    floatingStore.add(floating);
    return () => floatingStore.remove(floating);
  }, [open, floating]);
  return floating;
}

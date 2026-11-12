import { useCallback, useState } from "react";
import type { OpenRow, TrayLayer } from "../../../../types/preview-tray.types";

/**
 * The rows on the tray's layer: the open one, and those still rolling back. Moving to another
 * preview, its row unrolls while the last one rolls back; back on a row that's rolling back, it
 * unrolls again.
 */
export function useTrayLayers(open: OpenRow | null) {
  const [layers, setLayers] = useState<TrayLayer[]>([]);
  const [was, setWas] = useState<OpenRow | null>(null);
  if (open !== was) {
    setWas(open);
    setLayers((ls) => {
      const rest = ls.filter((l) => l.open.id !== open?.id).map((l) => ({ ...l, leaving: true }));
      return open ? [...rest, { open, leaving: false }] : rest;
    });
  }
  const gone = useCallback((id: string) => setLayers((ls) => ls.filter((l) => !(l.leaving && l.open.id === id))), []);
  return { layers, gone };
}

import { useCallback, useMemo, useRef, useState } from "react";
import type { PictureWidth } from "../types/picture-width.types";

/**
 * The picture layer's width in px, followed as the picture changes shape or the window its size:
 * what decides which controls fit on it. Null until the layer is laid out. Go live reports its own
 * width (it depends on its words), remembered while it's folded.
 */
export function usePictureWidth(): PictureWidth {
  const [width, setWidth] = useState<number | null>(null);
  const [goLive, setGoLive] = useState<number | null>(null);
  const watch = useRef<ResizeObserver | null>(null);
  const setLayer = useCallback((layer: HTMLElement | null) => {
    watch.current?.disconnect();
    watch.current = null;
    if (!layer) return;
    // Zero is a layer not laid out yet (hidden, or no layout at all): unknown, so nothing folds.
    const measure = () => setWidth(Math.round(layer.getBoundingClientRect().width) || null);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    watch.current = new ResizeObserver(measure);
    watch.current.observe(layer);
  }, []);
  return useMemo(() => ({ setLayer, width, goLive, setGoLive }), [setLayer, width, goLive]);
}

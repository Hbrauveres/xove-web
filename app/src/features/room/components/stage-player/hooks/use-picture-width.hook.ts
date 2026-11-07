import { useCallback, useRef, useState } from "react";
import { GO_LIVE_PILL } from "../constants/row-fold.constants";
import type { PictureWidth } from "../types/picture-width.types";

/**
 * The picture layer's width in px, followed as the picture changes shape or the window its size:
 * what decides which controls fit on it. Null until the layer is laid out. Go live's pill is measured
 * at the same moments while it's shown (its width depends on its words), and remembered while it's
 * folded, so a wider picture brings it back at the right width.
 */
export function usePictureWidth(): PictureWidth {
  const [width, setWidth] = useState<number | null>(null);
  const [goLive, setGoLive] = useState<number | null>(null);
  const watch = useRef<ResizeObserver | null>(null);
  const setLayer = useCallback((layer: HTMLElement | null) => {
    watch.current?.disconnect();
    watch.current = null;
    if (!layer) return;
    const measure = () => {
      // Zero is a layer not laid out yet (hidden, or no layout at all): unknown, so nothing folds.
      setWidth(Math.round(layer.getBoundingClientRect().width) || null);
      const pill = Math.ceil(layer.querySelector(GO_LIVE_PILL)?.getBoundingClientRect().width ?? 0);
      if (pill > 0) setGoLive(pill);
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    watch.current = new ResizeObserver(measure);
    watch.current.observe(layer);
  }, []);
  return { setLayer, width, goLive };
}

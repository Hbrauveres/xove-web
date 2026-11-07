import { useCallback, useRef, useState } from "react";
import type { PictureWidth } from "../types/picture-width.types";

/**
 * The picture layer's width in px, followed as the picture changes shape or the window its size:
 * what decides which controls fit on it. Null until the layer is laid out. The layer itself too, for
 * what's measured on it.
 */
export function usePictureWidth(): PictureWidth {
  const [width, setWidth] = useState<number | null>(null);
  const [el, setEl] = useState<HTMLElement | null>(null);
  const watch = useRef<ResizeObserver | null>(null);
  const ref = useCallback((el: HTMLElement | null) => {
    watch.current?.disconnect();
    watch.current = null;
    setEl(el);
    if (!el) return;
    // Zero is a layer not laid out yet (hidden, or no layout at all): unknown, so nothing folds.
    const measure = () => setWidth(Math.round(el.getBoundingClientRect().width) || null);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    watch.current = new ResizeObserver(measure);
    watch.current.observe(el);
  }, []);
  return { ref, el, width };
}

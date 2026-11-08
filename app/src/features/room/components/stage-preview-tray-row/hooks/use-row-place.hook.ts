import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { OpenRow } from "../../../types/preview-tray.types";
import { placeRow } from "../utils/place-row.util";
import { slotBox } from "../utils/slot-box.util";

/**
 * Keeps a row glued to its preview's picture on every frame (one measure a frame), so nothing that
 * moves the preview (the strip scrolling, the page settling) leaves it behind. It follows the
 * picture's slot, so what only animates the picture (a swap's bounce) never moves it. The side is chosen
 * once, as it opens; it shows a frame after it's placed, so it unrolls from its edge.
 */
export function useRowPlace(open: OpenRow, onElement?: (el: HTMLElement | null) => void) {
  const element = useRef<HTMLElement | null>(null);
  const [side, setSide] = useState<"below" | "above" | null>(null);
  const [placed, setPlaced] = useState(false);
  const ref = useCallback(
    (el: HTMLElement | null) => {
      element.current = el;
      onElement?.(el);
    },
    [onElement],
  );
  useLayoutEffect(() => {
    let below: boolean | null = null;
    let frame = 0;
    const place = () => {
      const el = element.current;
      if (!el) return;
      // By the picture's slot, not where it's drawn: a swap's bounce never moves the row.
      const at = placeRow(slotBox(open.anchor, open.picture), el.offsetHeight, window.innerHeight, below);
      if (below === null) setSide(at.below ? "below" : "above");
      below = at.below;
      el.style.left = `${at.left}px`;
      el.style.width = `${at.width}px`;
      el.style.top = at.top === undefined ? "" : `${at.top}px`;
      el.style.bottom = at.bottom === undefined ? "" : `${at.bottom}px`;
    };
    const loop = () => {
      place();
      frame = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(frame);
  }, [open]);
  useEffect(() => {
    if (!side) return;
    const f = requestAnimationFrame(() => setPlaced(true));
    return () => cancelAnimationFrame(f);
  }, [side]);
  return { ref, element, side, placed };
}

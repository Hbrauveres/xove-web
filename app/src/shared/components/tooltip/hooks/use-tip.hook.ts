import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { TIP_REST_MS } from "@shared/constants/floating.constants";
import { floatingStore, useFloating } from "@shared/stores/floating-store";
import type { TipOptions } from "../types/tooltip.types";
import { placeTip } from "../utils/place-tip.util";

/** Whether a tooltip shows, where, and what makes it go: one floating thing among the others. */
export function useTip({ tip, anchor, quiet, text }: TipOptions) {
  const [shown, setShown] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const hide = useCallback(() => {
    window.clearTimeout(timer.current);
    setShown(false);
  }, []);
  const show = useCallback(() => setShown(true), []);
  const rest = useCallback(() => {
    window.clearTimeout(timer.current);
    if (floatingStore.isWarm()) show();
    else timer.current = window.setTimeout(show, TIP_REST_MS);
  }, [show]);
  useFloating({ open: shown, kind: "tooltip", close: hide, area: () => tip.current, anchor: () => anchor.current });
  // Hidden after showing: the next one along the row shows at once for a moment.
  const wasShown = useRef(false);
  useEffect(() => {
    if (shown) {
      wasShown.current = true;
      return;
    }
    if (wasShown.current) floatingStore.warmUp();
    wasShown.current = false;
  }, [shown]);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  if (quiet && shown) setShown(false);

  useLayoutEffect(() => {
    const el = tip.current;
    const control = anchor.current;
    if (!shown || !el || !control) return;
    const { left, top } = placeTip(control.getBoundingClientRect(), el.offsetWidth, el.offsetHeight, window.innerWidth);
    el.style.setProperty("left", `${left}px`);
    el.style.setProperty("top", `${top}px`);
  }, [shown, text, tip, anchor]);
  // Scrolling moves the control away: the tooltip goes.
  useEffect(() => {
    if (!shown) return;
    window.addEventListener("scroll", hide, true);
    return () => window.removeEventListener("scroll", hide, true);
  }, [shown, hide]);

  return { shown, show, hide, rest };
}

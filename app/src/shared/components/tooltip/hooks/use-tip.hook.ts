import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { TIP_REST_MS } from "@shared/constants/floating.constants";
import { floatingStore, useFloating } from "@shared/stores/floating-store";
import type { TipOptions } from "../types/tooltip.types";
import { placeTip } from "../utils/place-tip.util";
import { textCut } from "../utils/text-cut.util";

/** Whether a tooltip shows, where, and what makes it go: one floating thing among the others. */
export function useTip({ tip, anchor, quiet, text, side, cutOnly = false }: TipOptions) {
  const [shown, setShown] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const hide = useCallback(() => {
    window.clearTimeout(timer.current);
    setShown(false);
  }, []);
  // Said only when it adds something: a cut name, whole.
  const show = useCallback(() => {
    if (!cutOnly || textCut(anchor.current)) setShown(true);
  }, [cutOnly, anchor]);
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

  // By its control on every frame while shown: a control that moves (into fullscreen, a row
  // re-centring) takes its tooltip with it.
  useLayoutEffect(() => {
    if (!shown) return;
    let frame = 0;
    const place = () => {
      const el = tip.current;
      const control = anchor.current;
      if (!el || !control) return;
      const at = placeTip(
        control.getBoundingClientRect(),
        { width: el.offsetWidth, height: el.offsetHeight },
        window.innerWidth,
        side,
      );
      el.style.setProperty("left", `${at.left}px`);
      el.style.setProperty("top", `${at.top}px`);
      frame = requestAnimationFrame(place);
    };
    place();
    return () => cancelAnimationFrame(frame);
  }, [shown, text, tip, anchor, side]);
  // Scrolling moves the control away: the tooltip goes.
  useEffect(() => {
    if (!shown) return;
    window.addEventListener("scroll", hide, true);
    return () => window.removeEventListener("scroll", hide, true);
  }, [shown, hide]);

  return { shown, show, hide, rest };
}

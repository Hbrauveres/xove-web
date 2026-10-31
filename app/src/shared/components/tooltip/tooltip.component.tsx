import {
  cloneElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
  type PointerEvent,
} from "react";
import { createPortal } from "react-dom";
import { useFloating } from "@shared/stores/floating-store";
import { TIP_REST_MS } from "@shared/constants/floating.constants";
import { EDGE, GAP } from "./constants/tooltip.constants";
import styles from "./tooltip.component.module.css";
import type { TooltipProps } from "./types/tooltip.types";
import { assignRef } from "./utils/assign-ref.util";
import { isWarm, warmUp } from "./utils/warmth.util";

/**
 * The app's one tooltip: a short text over a control, said with a mouse or the
 * keyboard. A finger gets none (a tap leaves a control "hovered"); a greyed-out control says why in
 * the toast instead. It floats on its own layer, above its control or below where there's no room,
 * never clipped. One floating thing at a time: it replaces another tooltip or what opened on a mouse
 * rest, and something opening closes it; it never closes what the person opened.
 */
export function Tooltip({ text, children, hidden = false }: TooltipProps) {
  const [shown, setShown] = useState(false);
  const anchor = useRef<HTMLElement | null>(null);
  const tip = useRef<HTMLSpanElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const id = useId();
  const hide = useCallback(() => {
    window.clearTimeout(timer.current);
    setShown(false);
  }, []);
  const show = useCallback(() => setShown(true), []);
  useFloating({ open: shown, kind: "tooltip", close: hide, area: () => tip.current, anchor: () => anchor.current });
  // Hidden after showing: the next one along the row shows at once for a moment.
  const wasShown = useRef(false);
  useEffect(() => {
    if (shown) {
      wasShown.current = true;
      return;
    }
    if (wasShown.current) warmUp();
    wasShown.current = false;
  }, [shown]);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  // Nothing to say, or told to keep quiet (a drop-up open over the control): gone.
  if ((!text || hidden) && shown) setShown(false);

  // Above its control, centred, within the window; below it where there's no room above.
  useLayoutEffect(() => {
    const el = tip.current;
    const a = anchor.current;
    if (!shown || !el || !a) return;
    const r = a.getBoundingClientRect();
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const left = Math.min(Math.max(EDGE, r.left + r.width / 2 - w / 2), window.innerWidth - EDGE - w);
    const above = r.top - GAP - h >= EDGE;
    el.style.left = `${left}px`;
    el.style.top = `${above ? r.top - GAP - h : r.bottom + GAP}px`;
  }, [shown, text]);
  // Scrolling moves the control away: the tooltip goes.
  useEffect(() => {
    if (!shown) return;
    window.addEventListener("scroll", hide, true);
    return () => window.removeEventListener("scroll", hide, true);
  }, [shown, hide]);

  const p = children.props;
  // Its own ref and the control's own, both.
  const childRef = p.ref;
  const setAnchor = useCallback(
    (el: HTMLElement | null) => {
      anchor.current = el;
      assignRef(childRef, el);
    },
    [childRef],
  );
  // Quiet or not, it describes its control: a screen reader hears what a drop-up hides. Unless it
  // only repeats the control's name, which would be heard twice.
  const describes = Boolean(text) && text !== p["aria-label"];
  const trigger = cloneElement(children, {
    ref: setAnchor,
    "aria-describedby": describes ? [p["aria-describedby"], id].filter(Boolean).join(" ") : p["aria-describedby"],
    onPointerEnter: (e: PointerEvent<HTMLElement>) => {
      p.onPointerEnter?.(e);
      if (e.pointerType !== "mouse" || !text || hidden) return;
      window.clearTimeout(timer.current);
      if (isWarm()) show();
      else timer.current = window.setTimeout(show, TIP_REST_MS);
    },
    onPointerLeave: (e: PointerEvent<HTMLElement>) => {
      p.onPointerLeave?.(e);
      hide();
    },
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      p.onPointerDown?.(e);
      hide();
    },
    onFocus: (e: FocusEvent<HTMLElement>) => {
      p.onFocus?.(e);
      if (text && !hidden && e.currentTarget.matches(":focus-visible")) show();
    },
    onBlur: (e: FocusEvent<HTMLElement>) => {
      p.onBlur?.(e);
      hide();
    },
  });
  return (
    <>
      {trigger}
      {text &&
        createPortal(
          <span ref={tip} id={id} role="tooltip" className={styles.tip} data-shown={shown || undefined}>
            {text}
          </span>,
          // In the browser's fullscreen only the fullscreen element is drawn: it floats there.
          document.fullscreenElement ?? document.body,
        )}
    </>
  );
}

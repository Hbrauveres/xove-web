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
  type ReactElement,
  type Ref,
} from "react";
import { createPortal } from "react-dom";
import { claimFloating, insideFloating, releaseFloating } from "./floating";
import styles from "./Tooltip.module.css";

/** A mouse rests this long before a tooltip shows; moving on to the next one shows it at once. */
export const TIP_REST_MS = 120;
/** How long after one hides the next still shows at once (the pointer travelling along a row). */
const WARM_MS = 400;
const GAP = 10;
const EDGE = 8;

let warmUntil = 0;
/** Whether a tooltip just hid, so the next one shows at once. */
const warm = () => Date.now() < warmUntil;
/** Hands an element to a ref of either kind. */
function assignRef<T>(ref: Ref<T> | undefined, el: T | null) {
  if (typeof ref === "function") ref(el);
  else if (ref) (ref as { current: T | null }).current = el;
}

type Trigger = ReactElement<{
  ref?: Ref<HTMLElement>;
  onPointerEnter?: (e: PointerEvent<HTMLElement>) => void;
  onPointerLeave?: (e: PointerEvent<HTMLElement>) => void;
  onPointerDown?: (e: PointerEvent<HTMLElement>) => void;
  onFocus?: (e: FocusEvent<HTMLElement>) => void;
  onBlur?: (e: FocusEvent<HTMLElement>) => void;
  "aria-describedby"?: string;
}>;

/**
 * The app's one tooltip (spec 0133): a short text over a control, said with a mouse or the
 * keyboard. A finger gets none (a tap leaves a control "hovered"); a greyed-out control says why in
 * the toast instead. It floats on its own layer, above its control or below where there's no room,
 * never clipped. One floating thing at a time: it closes any drop-up or other tooltip as it shows,
 * and a drop-up opening closes it.
 */
export function Tooltip({ text, children, hidden = false }: { text?: string; children: Trigger; hidden?: boolean }) {
  const [shown, setShown] = useState(false);
  const anchor = useRef<HTMLElement | null>(null);
  const tip = useRef<HTMLSpanElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const id = useId();
  const hide = useCallback(() => {
    window.clearTimeout(timer.current);
    setShown(false);
  }, []);
  const show = useCallback(() => {
    // Inside an open drop-up (its picker): part of it, so it doesn't close it.
    if (!insideFloating(anchor.current)) claimFloating(hide);
    setShown(true);
  }, [hide]);
  // Hidden after showing: the next one along the row shows at once for a moment.
  const wasShown = useRef(false);
  useEffect(() => {
    if (shown) {
      wasShown.current = true;
      return;
    }
    releaseFloating(hide);
    if (wasShown.current) warmUntil = Date.now() + WARM_MS;
    wasShown.current = false;
  }, [shown, hide]);
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
  const trigger = cloneElement(children, {
    ref: setAnchor,
    // Quiet or not, it describes its control: a screen reader hears what a drop-up hides.
    "aria-describedby": text ? [p["aria-describedby"], id].filter(Boolean).join(" ") : p["aria-describedby"],
    onPointerEnter: (e: PointerEvent<HTMLElement>) => {
      p.onPointerEnter?.(e);
      if (e.pointerType !== "mouse" || !text || hidden) return;
      window.clearTimeout(timer.current);
      if (warm()) show();
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
          document.body,
        )}
    </>
  );
}

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { claimFloating, dismissFloating, releaseFloating } from "./floating";
import styles from "./DropUp.module.css";

/** How long the pointer rests on the button before the drop-up unrolls. */
export const OPEN_DELAY_MS = 120;
/** A slip of the pointer outside shorter than this doesn't close it. */
export const LEAVE_GRACE_MS = 300;

type Props = {
  /** Its name for screen readers. */
  label: string;
  /** Only while its stream is live. */
  enabled: boolean;
  /** The round button it belongs to; a click on it does what it always does. */
  trigger: ReactNode;
  /** Told when it closes because the pointer left (a picker inside closes too). */
  onLeave?: () => void;
  /** Its width, when not the usual 228 px. */
  width?: number;
  /** A new value closes it: its action is done (a camera picked, Change). */
  closeSignal?: number;
  /**
   * Another panel already shows these controls (the settings): resting the mouse calls this
   * instead of opening, and nothing opens over the button.
   */
  redirect?: () => void;
  children: ReactNode;
};

/**
 * Quick access over a live round button: resting the mouse on the button unrolls one frosted
 * pill above it, centred, after a short pause; moving up into it keeps it open (the gap is
 * bridged); leaving closes it, even right after a click, with a short grace for a slip. The
 * keyboard's focus opens it too. A click still does what the button does.
 */
export function DropUp({ label, enabled, trigger, onLeave, width, closeSignal, redirect, children }: Props) {
  const [open, setOpen] = useState(false);
  const opening = useRef<number | undefined>(undefined);
  const leaving = useRef<number | undefined>(undefined);
  const root = useRef<HTMLDivElement>(null);

  const clear = () => {
    window.clearTimeout(opening.current);
    window.clearTimeout(leaving.current);
  };
  useEffect(() => clear, []);

  // The stream stopped, or its action is done: closed.
  const [wasEnabled, setWasEnabled] = useState(enabled);
  const [lastSignal, setLastSignal] = useState(closeSignal);
  if (enabled !== wasEnabled || closeSignal !== lastSignal) {
    setWasEnabled(enabled);
    setLastSignal(closeSignal);
    if (open) setOpen(false);
  }

  const close = () => {
    clear();
    setOpen(false);
    onLeave?.();
  };
  // One floating thing at a time, across the app: opening closes any other drop-up
  // or tooltip at once, without its grace, and a tooltip showing closes this one.
  const closeMe = useRef(close);
  useEffect(() => {
    closeMe.current = close;
  });
  const [me] = useState(() => () => closeMe.current());
  useEffect(() => {
    if (open) claimFloating(me, root.current);
    else releaseFloating(me);
  }, [open, me]);
  const closeOthers = () => dismissFloating(me);

  // ---- the mouse
  const onPointerEnter = () => {
    if (!open) closeOthers();
    window.clearTimeout(leaving.current);
    if (open) return;
    opening.current = window.setTimeout(() => (redirect ? redirect() : setOpen(true)), OPEN_DELAY_MS);
  };
  const onPointerLeave = () => {
    window.clearTimeout(opening.current);
    leaving.current = window.setTimeout(close, LEAVE_GRACE_MS);
  };

  // ---- the keyboard: only its focus opens it; a click's focus doesn't keep it open
  const onFocus = (e: FocusEvent) => {
    let keyboard = false;
    try {
      keyboard = (e.target as Element).matches(":focus-visible");
    } catch {
      keyboard = false;
    }
    // Redirected, the keyboard reaches the panel itself: tabbing past the button moves nothing.
    if (keyboard && !redirect) {
      closeOthers();
      setOpen(true);
    }
  };
  const onBlur = (e: FocusEvent) => {
    if (!root.current?.contains(e.relatedTarget as Node | null) && !root.current?.matches(":hover")) setOpen(false);
  };
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "Escape" || !open) return;
    // Back to the button first: its focus would otherwise open it again.
    root.current?.querySelector<HTMLElement>("[data-dropup-trigger] button")?.focus();
    close();
  };

  // Always the same wrapper around the button, so it keeps the keyboard's focus when its
  // stream starts or stops; only the drop-up and its handlers come and go.
  if (!enabled) {
    return (
      <div className={styles.wrap}>
        <div className={styles.trigger} data-dropup-trigger>
          {trigger}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={root}
      className={styles.wrap}
      data-dropup
      data-open={open}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
    >
      <div className={styles.trigger} data-dropup-trigger>
        {trigger}
      </div>
      <div
        className={styles.dropup}
        role="group"
        aria-label={label}
        inert={!open || undefined}
        style={width ? ({ "--dropup-width": `${width}px` } as CSSProperties) : undefined}
      >
        {children}
      </div>
    </div>
  );
}

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import styles from "./PreviewTray.module.css";

/** How long the row waits after the pointer leaves, so moving from a preview to its row keeps it. */
const LEAVE_MS = 250;
/** Its distance from the preview, and from the window's edge. */
const GAP = 6;
const EDGE = 8;
/** The room a slider adds when it unrolls: the side is chosen with it, so it never flips later. */
const SLIDER_ROOM = 32;

type Open = { id: string; anchor: HTMLElement; pinned: boolean };

/**
 * Where a small preview's row is open (spec 0131): pointing at a preview opens it (a mouse), a hold
 * pins it (a finger) until a press elsewhere; a slider in use keeps it open wherever the mouse goes.
 */
export function usePreviewTray() {
  const [open, setOpen] = useState<Open | null>(null);
  const [busy, setBusy] = useState(false);
  const over = useRef(false);
  const timer = useRef<number | undefined>(undefined);
  const stay = useCallback(() => {
    over.current = true;
    window.clearTimeout(timer.current);
  }, []);
  const show = useCallback((id: string, anchor: HTMLElement, pinned = false) => {
    over.current = true;
    window.clearTimeout(timer.current);
    setOpen((was) => (was?.pinned && !pinned && was.id === id ? was : { id, anchor, pinned }));
  }, []);
  const leave = useCallback(() => {
    over.current = false;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen((was) => (was?.pinned ? was : null)), LEAVE_MS);
  }, []);
  // A slider let go while the pointer is elsewhere: the row goes too.
  useEffect(() => {
    if (!busy && open && !open.pinned && !over.current) leave();
  }, [busy, open, leave]);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return { open, busy, setBusy, show, leave, stay, close: () => setOpen(null) };
}

/**
 * The row itself, floating over the page at the preview's width: under it, or above it where the
 * window has no room under it. On its own layer, so the previews' scrolling strip never clips it.
 */
export function PreviewTray({
  tray,
  children,
}: {
  tray: ReturnType<typeof usePreviewTray>;
  children: ReactNode;
}) {
  const { open, busy, leave, stay, close } = tray;
  const ref = useRef<HTMLDivElement>(null);
  // Under the preview or above it: chosen once, as it opens, with room for a slider.
  const [side, setSide] = useState<"below" | "above" | null>(null);
  useLayoutEffect(() => {
    if (!open) return;
    let below: boolean | null = null;
    let frame = 0;
    // Glued to its preview on every frame while open (one measure a frame), so nothing that moves
    // the preview (the strip scrolling, the page settling) leaves the row behind.
    const place = () => {
      const el = ref.current;
      if (!el) return;
      // The picture itself (not what peeks out behind a stacked one): the row is its width, centred.
      const r = (open.anchor.querySelector("[data-picture]") ?? open.anchor).getBoundingClientRect();
      if (below === null) {
        below = r.bottom + GAP + el.offsetHeight + SLIDER_ROOM <= window.innerHeight - EDGE;
        setSide(below ? "below" : "above");
      }
      el.style.left = `${r.left}px`;
      el.style.width = `${r.width}px`;
      el.style.top = below ? `${r.bottom + GAP}px` : "";
      el.style.bottom = below ? "" : `${window.innerHeight - r.top + GAP}px`;
    };
    const loop = () => {
      place();
      frame = requestAnimationFrame(loop);
    };
    loop();
    return () => {
      cancelAnimationFrame(frame);
      setSide(null);
    };
  }, [open]);
  // Scrolling the previews moves them away: the row closes. A press elsewhere does too.
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!ref.current?.contains(t) && !open.anchor.contains(t)) close();
    };
    const scrolled = (e: Event) => {
      if (!busy && !ref.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("pointerdown", away);
    document.addEventListener("scroll", scrolled, true);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("scroll", scrolled, true);
    };
  }, [open, busy, close]);
  if (!open) return null;
  return createPortal(
    <div
      ref={ref}
      className={styles.tray}
      data-shown={side ? true : undefined}
      data-up={side === "above" || undefined}
      style={{ left: -9999, top: 0 }}
      onPointerEnter={stay}
      onPointerLeave={(e) => e.pointerType === "mouse" && leave()}
    >
      {children}
    </div>,
    document.body,
  );
}

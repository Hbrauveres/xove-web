import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { Open, usePreviewTray } from "./usePreviewTray";
import styles from "./PreviewTray.module.css";

/** Its distance from the preview, and from the window's edge. */
const GAP = 6;
const EDGE = 8;
/** The room a slider adds when it unrolls: the side is chosen with it, so it never flips later. */
const SLIDER_ROOM = 32;

/** What Tab stops at, in order. */
const TABBABLE = 'button, input, [href], [tabindex]:not([tabindex="-1"])';
const tabbables = (root: ParentNode) =>
  [...root.querySelectorAll<HTMLElement>(TABBABLE)].filter((el) => !el.closest("[inert]") && !(el as HTMLButtonElement).disabled);

/** How long a row takes to roll back into its preview, at most (its transition ends it sooner). */
const OUT_MS = 320;

type Layer = { open: Open; leaving: boolean };

/**
 * The rows themselves, floating over the page at the preview's width: under it, or above it where
 * the window has no room under it. On their own layer, so the previews' scrolling strip never clips
 * them. Moving to another preview, its row unrolls from it while the last one rolls back into its own.
 */
export function PreviewTray({
  tray,
  render,
}: {
  tray: ReturnType<typeof usePreviewTray>;
  /** One person's row. */
  render: (id: string) => ReactNode;
}) {
  const { open, busy, leave, stay, close } = tray;
  const ref = useRef<HTMLDivElement>(null);
  // The open row, and those still rolling back. Back on a row that is rolling back: it unrolls again.
  const [layers, setLayers] = useState<Layer[]>([]);
  const [was, setWas] = useState<Open | null>(null);
  if (open !== was) {
    setWas(open);
    setLayers((ls) => {
      const rest = ls.filter((l) => l.open.id !== open?.id).map((l) => ({ ...l, leaving: true }));
      return open ? [...rest, { open, leaving: false }] : rest;
    });
  }
  const gone = useCallback((id: string) => setLayers((ls) => ls.filter((l) => !(l.leaving && l.open.id === id))), []);
  // A press elsewhere closes the row. Scrolling the previews moves them away: it closes too.
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
  if (!layers.length) return null;
  return createPortal(
    <div ref={ref}>
      {layers.map((l) => (
        <Row key={l.open.id} layer={l} onGone={gone} onEnter={stay} onLeave={leave}>
          {render(l.open.id)}
        </Row>
      ))}
    </div>,
    document.body,
  );
}

function Row({
  layer,
  onGone,
  onEnter,
  onLeave,
  children,
}: {
  layer: Layer;
  onGone: (id: string) => void;
  onEnter: () => void;
  onLeave: () => void;
  children: ReactNode;
}) {
  const { open, leaving } = layer;
  const ref = useRef<HTMLDivElement>(null);
  // Under the preview or above it: chosen once, as it opens, with room for a slider.
  const [side, setSide] = useState<"below" | "above" | null>(null);
  useLayoutEffect(() => {
    let below: boolean | null = null;
    let frame = 0;
    // Glued to its preview on every frame (one measure a frame), so nothing that moves the preview
    // (the strip scrolling, the page settling) leaves the row behind.
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
    return () => cancelAnimationFrame(frame);
  }, [open]);
  // Shown a frame after it is placed, so it unrolls from the right edge.
  const [placed, setPlaced] = useState(false);
  useEffect(() => {
    if (!side) return;
    const f = requestAnimationFrame(() => setPlaced(true));
    return () => cancelAnimationFrame(f);
  }, [side]);
  // Rolled back: gone (at the end of its transition, or after OUT_MS where there is none).
  useEffect(() => {
    if (!leaving) return;
    const t = window.setTimeout(() => onGone(open.id), OUT_MS);
    return () => window.clearTimeout(t);
  }, [leaving, open.id, onGone]);
  return (
    <div
      ref={ref}
      className={styles.tray}
      data-shown={(placed && !leaving) || undefined}
      data-leaving={leaving || undefined}
      data-up={side === "above" || undefined}
      inert={leaving}
      style={{ left: -9999, top: 0 }}
      data-tray-for={open.id}
      onPointerEnter={onEnter}
      onPointerLeave={(e) => e.pointerType === "mouse" && onLeave()}
      // By keyboard (spec 0131): the row sits between its preview and the next one in Tab's order.
      onFocus={onEnter}
      onBlur={(e) => {
        const to = e.relatedTarget as Node | null;
        if (!to || (!ref.current?.contains(to) && !open.anchor.contains(to))) onLeave();
      }}
      onKeyDown={(e) => {
        const inRow = tabbables(e.currentTarget);
        const back = open.anchor.querySelector<HTMLElement>(TABBABLE);
        if (e.key === "Escape" || (e.key === "Tab" && e.shiftKey && e.target === inRow[0])) {
          e.preventDefault();
          back?.focus();
        } else if (e.key === "Tab" && !e.shiftKey && e.target === inRow.at(-1)) {
          // On to whatever follows the preview.
          const next = tabbables(document).find(
            (el) => !open.anchor.contains(el) && !e.currentTarget.contains(el) && open.anchor.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING,
          );
          if (next) {
            e.preventDefault();
            next.focus();
          }
        }
      }}
      onTransitionEnd={(e) => leaving && e.target === e.currentTarget && e.propertyName === "clip-path" && onGone(open.id)}
    >
      {children}
    </div>
  );
}

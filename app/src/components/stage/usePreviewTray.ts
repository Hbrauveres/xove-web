import { useCallback, useEffect, useRef, useState } from "react";

/** How long the row waits after the pointer leaves, so moving from a preview to its row keeps it. */
const LEAVE_MS = 250;

export type Open = { id: string; anchor: HTMLElement; pinned: boolean };

/**
 * Where a small preview's row is open (spec 0131): pointing at a preview opens it (a mouse), a hold
 * pins it (a finger) until a press elsewhere; a slider in use keeps it open wherever the mouse goes.
 */
export function usePreviewTray() {
  const [open, setOpen] = useState<Open | null>(null);
  const [busy, setBusy] = useState(false);
  const over = useRef(false);
  const shownId = useRef<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const stay = useCallback(() => {
    over.current = true;
    window.clearTimeout(timer.current);
  }, []);
  const show = useCallback((id: string, anchor: HTMLElement, pinned = false) => {
    over.current = true;
    window.clearTimeout(timer.current);
    setOpen((was) => (was?.pinned && !pinned && was.id === id ? was : { id, anchor, pinned }));
    // Another preview: the last one's slider, rolling back with it, no longer holds the row.
    if (shownId.current !== id) setBusy(false);
    shownId.current = id;
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
  useEffect(() => {
    if (!open) shownId.current = null;
  }, [open]);
  return { open, busy, setBusy, show, leave, stay, close: () => setOpen(null) };
}

import { useCallback, useEffect, useRef, useState } from "react";

/** How long the row waits after the pointer leaves, so moving from a preview to its row keeps it. */
const LEAVE_MS = 250;

export type Open = { id: string; anchor: HTMLElement };

/**
 * Where a small preview's row is open: pointing at a preview opens it; a slider in use keeps it open
 * wherever the mouse goes.
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
  const show = useCallback((id: string, anchor: HTMLElement) => {
    over.current = true;
    window.clearTimeout(timer.current);
    setOpen({ id, anchor });
    // Another preview: the last one's slider, rolling back with it, no longer holds the row.
    if (shownId.current !== id) setBusy(false);
    shownId.current = id;
  }, []);
  const leave = useCallback(() => {
    over.current = false;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(null), LEAVE_MS);
  }, []);
  // A slider let go while the pointer is elsewhere: the row goes too.
  useEffect(() => {
    if (!busy && open && !over.current) leave();
  }, [busy, open, leave]);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => {
    if (!open) shownId.current = null;
  }, [open]);
  return { open, busy, setBusy, show, leave, stay, close: () => setOpen(null) };
}

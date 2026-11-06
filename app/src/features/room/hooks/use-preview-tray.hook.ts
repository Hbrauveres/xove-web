import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TRAY_LEAVE_MS } from "../constants/preview-tray.constants";
import type { OpenRow } from "../types/preview-tray.types";
import { tabbables } from "../utils/tabbables.util";

/**
 * Where a small preview's row is open: pointing at a preview opens it; a slider in use keeps it
 * open wherever the mouse goes. The open row hands its element back (`setRow`), so the keyboard
 * can go into it from its preview.
 */
export function usePreviewTray() {
  const [open, setOpen] = useState<OpenRow | null>(null);
  const [busy, setBusy] = useState(false);
  const over = useRef(false);
  const shownId = useRef<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const row = useRef<HTMLElement | null>(null);
  const stay = useCallback(() => {
    over.current = true;
    window.clearTimeout(timer.current);
  }, []);
  const show = useCallback((next: OpenRow) => {
    over.current = true;
    window.clearTimeout(timer.current);
    setOpen(next);
    // Another preview: the last one's slider, rolling back with it, no longer holds the row.
    if (shownId.current !== next.id) setBusy(false);
    shownId.current = next.id;
  }, []);
  const leave = useCallback(() => {
    over.current = false;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(null), TRAY_LEAVE_MS);
  }, []);
  /** The focus left a preview: the row stays only if the focus went into it. */
  const blurred = useCallback((to: Node | null) => !(to && row.current?.contains(to)) && leave(), [leave]);
  /** Tab from a preview: into its open row's first stop. False when there's nothing to go to. */
  const enterRow = useCallback(() => {
    const first = row.current && tabbables(row.current)[0];
    first?.focus();
    return Boolean(first);
  }, []);
  const setRow = useCallback((el: HTMLElement | null) => {
    row.current = el;
  }, []);
  const close = useCallback(() => setOpen(null), []);
  // A slider let go while the pointer is elsewhere: the row goes too.
  useEffect(() => {
    if (!busy && open && !over.current) leave();
  }, [busy, open, leave]);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => {
    if (!open) shownId.current = null;
  }, [open]);
  return useMemo(
    () => ({ open, busy, setBusy, show, leave, stay, close, blurred, enterRow, setRow }),
    [open, busy, show, leave, stay, close, blurred, enterRow, setRow],
  );
}

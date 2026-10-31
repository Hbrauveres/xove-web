import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { useFloating } from "@shared/stores/floating-store";
import { ROLL_MS } from "./constants/dropdown.constants";
import styles from "./dropdown.component.module.css";
import type { DropdownProps } from "./types/dropdown.types";

/**
 * The room's floating panel: frosted sections with clear cuts between them, that
 * unroll downward and roll back up. It's one floating thing, opened by its button: a press outside, Escape or another opening closes it.
 */
export function Dropdown({
  open,
  onClose,
  anchor,
  label,
  role = "dialog",
  align = "end",
  className,
  width,
  children,
}: DropdownProps) {
  const id = useId();
  const panel = useRef<HTMLDivElement>(null);
  // Stays on the page while it rolls up.
  const [mounted, setMounted] = useState(open);
  const [unrolled, setUnrolled] = useState(false);
  useFloating({ open, kind: "opened", close: onClose, area: () => panel.current, anchor: () => anchor.current });

  if (open && !mounted) setMounted(true);
  if (!open && unrolled) setUnrolled(false);
  const rolledOut = unrolled && open;

  useEffect(() => {
    if (open) {
      // One frame rolled up, then unroll: the height has something to animate from.
      const frame = requestAnimationFrame(() => setUnrolled(true));
      return () => cancelAnimationFrame(frame);
    }
    const timer = window.setTimeout(() => setMounted(false), ROLL_MS);
    return () => window.clearTimeout(timer);
  }, [open]);

  // Opening: take the focus.
  useEffect(() => {
    if (!open) return;
    const first = panel.current?.querySelector<HTMLElement>(role === "menu" ? "[role^=menuitem]" : "[data-autofocus]");
    (first ?? panel.current)?.focus();
  }, [open, role]);

  const onKeyDown = (e: KeyboardEvent) => {
    if (role !== "menu" || (e.key !== "ArrowDown" && e.key !== "ArrowUp")) return;
    e.preventDefault();
    const items = [...(panel.current?.querySelectorAll<HTMLElement>("[role^=menuitem]") ?? [])];
    const at = items.indexOf(document.activeElement as HTMLElement);
    items[(at + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length]?.focus();
  };

  if (!mounted) return null;
  return (
    <div
      ref={panel}
      id={id}
      role={role}
      aria-label={label}
      tabIndex={-1}
      className={[styles.panel, styles[align], className].filter(Boolean).join(" ")}
      // The roll is the height only: a clip, fade or filter would stop the sections' blur.
      style={{ gridTemplateRows: rolledOut ? "1fr" : "0fr", width }}
      data-rolled={rolledOut ? "out" : "up"}
      onKeyDown={onKeyDown}
    >
      <div className={styles.roll}>{children}</div>
    </div>
  );
}

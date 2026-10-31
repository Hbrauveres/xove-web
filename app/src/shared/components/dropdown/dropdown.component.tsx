import { useEffect, useId, useRef } from "react";
import { useFloating } from "@shared/stores/floating-store";
import styles from "./dropdown.component.module.css";
import type { DropdownProps } from "./types/dropdown.types";
import { useMenuArrows } from "./hooks/use-menu-arrows.hook";
import { useRoll } from "./hooks/use-roll.hook";
import { takeFocus } from "./utils/take-focus.util";

/**
 * The room's floating panel: frosted sections with clear cuts between them, that
 * unroll downward and roll back up. It's one floating thing, opened by its button: a press outside,
 * Escape or another opening closes it.
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
  const { mounted, rolledOut } = useRoll(open);
  useFloating({ open, kind: "opened", close: onClose, area: () => panel.current, anchor: () => anchor.current });

  // Opening: take the focus.
  useEffect(() => {
    if (!open) return;
    takeFocus(panel.current, role);
  }, [open, role]);

  useMenuArrows(panel, open && role === "menu");

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
    >
      <div className={styles.roll}>{children}</div>
    </div>
  );
}

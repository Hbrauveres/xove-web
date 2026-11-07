import { useEffect } from "react";
import { OUT_MS } from "./constants/stage-preview-tray-row.constants";
import { useRowEvents } from "./hooks/use-row-events.hook";
import { useRowPlace } from "./hooks/use-row-place.hook";
import styles from "./stage-preview-tray-row.component.module.css";
import type { StagePreviewTrayRowProps } from "./types/stage-preview-tray-row.types";

/**
 * One preview's row on the tray's layer, at its picture's width, under it or above it. It unrolls from
 * its edge and rolls back into it. By keyboard it sits between its preview and the next one in Tab's
 * order.
 */
export function StagePreviewTrayRow({
  layer,
  onGone,
  onEnter,
  onLeave,
  onElement,
  children,
}: StagePreviewTrayRowProps) {
  const { open, leaving } = layer;
  const { ref, element, side, placed } = useRowPlace(open, leaving ? undefined : onElement);
  // Rolled back: gone (at the end of its transition, or after OUT_MS where there is none).
  useEffect(() => {
    if (!leaving) return;
    const t = window.setTimeout(() => onGone(open.id), OUT_MS);
    return () => window.clearTimeout(t);
  }, [leaving, open.id, onGone]);
  useRowEvents(element, open, {
    onEnter,
    onLeave,
    onRolledBack: () => leaving && onGone(open.id),
  });
  return (
    <div
      ref={ref}
      className={styles.tray}
      data-shown={(placed && !leaving) || undefined}
      data-leaving={leaving || undefined}
      data-up={side === "above" || undefined}
      inert={leaving}
    >
      {children}
    </div>
  );
}

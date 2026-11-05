import styles from "./panel-section.component.module.css";
import type { PanelSectionProps } from "./types/panel-section.types";

/** One section of a Panel with cuts, carrying the glass itself; `scroll` for a list that may be long. */
export function PanelSection({ scroll = false, className, children }: PanelSectionProps) {
  return (
    <div className={[styles.section, scroll ? styles.scroll : "", className].filter(Boolean).join(" ")}>{children}</div>
  );
}

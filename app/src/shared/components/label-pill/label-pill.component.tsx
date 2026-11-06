import styles from "./label-pill.component.module.css";
import type { LabelPillProps } from "./types/label-pill.types";

/** A name over a picture: a small glass pill, a face or an icon, then the words. Not a button. */
export function LabelPill({ lead, children, className }: LabelPillProps) {
  return (
    <span className={className ? `${styles.pill} ${className}` : styles.pill}>
      {lead}
      {children}
    </span>
  );
}

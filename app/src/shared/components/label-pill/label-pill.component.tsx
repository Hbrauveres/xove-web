import styles from "./label-pill.component.module.css";
import type { LabelPillProps } from "./types/label-pill.types";

/** A label over a picture: a small glass pill, a face or an icon, then the words. Not a button. */
export function LabelPill({ lead, children, className }: LabelPillProps) {
  return (
    <span className={[styles.pill, !lead && styles.words, className].filter(Boolean).join(" ")}>
      {lead}
      {children}
    </span>
  );
}

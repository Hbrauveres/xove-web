import styles from "./label-pill.component.module.css";
import type { LabelPillProps } from "./types/label-pill.types";

/** A label: a small pill, a face, an icon or a dot, then the words. Not a button. */
export function LabelPill({ lead, children, tone = "glass", size = "s", className }: LabelPillProps) {
  const classes = [styles.pill, styles[tone], styles[size], !lead && styles.words, className];
  return (
    <span className={classes.filter(Boolean).join(" ")}>
      {lead}
      {children}
    </span>
  );
}

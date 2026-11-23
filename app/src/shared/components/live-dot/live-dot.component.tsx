import styles from "./live-dot.component.module.css";
import type { LiveDotProps } from "./types/live-dot.types";

/** The red dot of something live, glowing a little: on Go live, on a live tab, beating on a wait. */
export function LiveDot({ size, pulse, tone = "live", className }: LiveDotProps) {
  const classes = [styles.dot, styles[size], pulse && styles.pulse, tone === "quiet" && styles.quiet, className]
    .filter(Boolean)
    .join(" ");
  return <i className={classes} aria-hidden="true" data-live />;
}

import styles from "./live-dot.component.module.css";
import type { LiveDotProps } from "./types/live-dot.types";

/** The red dot of something live, glowing a little: on Go live and on a live tab. */
export function LiveDot({ size, className }: LiveDotProps) {
  return <i className={[styles.dot, styles[size], className].filter(Boolean).join(" ")} aria-hidden="true" data-live />;
}

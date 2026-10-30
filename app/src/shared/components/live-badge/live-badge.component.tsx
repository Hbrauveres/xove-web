import styles from "./live-badge.component.module.css";
import type { LiveBadgeProps } from "./types/live-badge.types";

/** LIVE, with its dot: a stream going out right now. */
export function LiveBadge({ variant, className }: LiveBadgeProps) {
  const look = `${styles.badge} ${styles[variant]}`;
  return <span className={className ? `${look} ${className}` : look}>LIVE</span>;
}

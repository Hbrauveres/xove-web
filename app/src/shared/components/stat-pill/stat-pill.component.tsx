import styles from "./stat-pill.component.module.css";
import type { StatPillProps } from "./types/stat-pill.types";

/** A number over a stream: a small glass pill, faces or an icon, then the number. */
export function StatPill({ lead, count, unit }: StatPillProps) {
  return (
    <span className={styles.pill} data-stat>
      <span className={styles.lead}>{lead}</span>
      <b className={styles.count}>{count}</b>
      <span className={styles.unit}> {unit}</span>
    </span>
  );
}

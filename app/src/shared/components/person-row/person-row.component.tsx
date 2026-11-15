import styles from "./person-row.component.module.css";
import type { PersonRowProps } from "./types/person-row.types";

/** A person in a row: their face, their name and a line under it, and what ends the row. */
export function PersonRow({ face, label, name, line, end, className }: PersonRowProps) {
  return (
    <div className={className ? `${styles.row} ${className}` : styles.row}>
      {face}
      <span className={styles.text}>
        {label && <span className={styles.quiet}>{label}</span>}
        <span className={styles.name}>{name}</span>
        {line && <span className={styles.quiet}>{line}</span>}
      </span>
      {end}
    </div>
  );
}

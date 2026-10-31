import styles from "./drop-up-row.component.module.css";
import type { DropUpRowProps } from "./types/drop-up-row.types";

/** One frosted pill in a drop-up: a short line and its action. */
export function DropUpRow({ children }: DropUpRowProps) {
  return <div className={styles.row}>{children}</div>;
}

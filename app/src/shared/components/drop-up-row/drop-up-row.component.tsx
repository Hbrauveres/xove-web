import styles from "./drop-up-row.component.module.css";
import type { DropUpRowProps } from "./types/drop-up-row.types";

/** One pill holding a short line and its action: frosted over the video, or a light track in a panel. */
export function DropUpRow({ look = "glass", children }: DropUpRowProps) {
  return <div className={`${styles.row} ${styles[look]}`}>{children}</div>;
}

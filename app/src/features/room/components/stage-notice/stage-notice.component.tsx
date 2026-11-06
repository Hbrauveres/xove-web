import styles from "./stage-notice.component.module.css";
import type { StageNoticeProps } from "./types/stage-notice.types";

/** A message in the middle of the stage, when there's no video to show. */
export function StageNotice({ title, text, spinner = false }: StageNoticeProps) {
  return (
    <output className={styles.notice}>
      {spinner && <span className={styles.spinner} aria-hidden="true" />}
      <p className={styles.title}>{title}</p>
      <p className={styles.text}>{text}</p>
    </output>
  );
}

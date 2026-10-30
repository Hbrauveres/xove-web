import styles from "./error-notice.component.module.css";
import type { ErrorNoticeProps } from "./types/error-notice.types";

/** A problem the person should know about now, read out by screen readers as it appears. */
export function ErrorNotice({ children, floating = false }: ErrorNoticeProps) {
  return (
    <p className={styles.notice} role="alert" data-floating={floating || undefined}>
      {children}
    </p>
  );
}

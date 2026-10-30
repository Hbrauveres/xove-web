import styles from "./error-notice.component.module.css";
import type { ErrorNoticeProps } from "./types/error-notice.types";

/** A problem the person should know about now, read out by screen readers as it appears. */
export function ErrorNotice({ children, className }: ErrorNoticeProps) {
  return (
    <p className={className ? `${styles.notice} ${className}` : styles.notice} role="alert">
      {children}
    </p>
  );
}

import { Icon } from "@shared/components/icon";
import styles from "./action-pill.component.module.css";
import type { ActionPillProps } from "./types/action-pill.types";

/** A button with words, round at both ends: two sizes, three fills, an optional icon or dot first. */
export function ActionPill({ size, fill, lead, unavailable, className, children, ref, ...button }: ActionPillProps) {
  const own = [styles.pill, styles[size], styles[fill], unavailable && styles.unavailable, className]
    .filter(Boolean)
    .join(" ");
  return (
    <button ref={ref} type="button" className={own} {...(unavailable ? { "aria-disabled": true } : {})} {...button}>
      {lead === "dot" ? <i className={styles.dot} aria-hidden="true" /> : lead && <Icon name={lead} />}
      {children}
    </button>
  );
}

import { Face } from "@shared/components/face";
import styles from "./header-activity-ticker.component.module.css";
import type { HeaderActivityTickerProps } from "./types/header-activity-ticker.types";

/** The activity pill's line: the latest event, sliding in when it changes, or that the connection dropped. */
export function HeaderActivityTicker({ reconnecting, latest }: HeaderActivityTickerProps) {
  if (reconnecting) {
    return (
      <span className={`${styles.tick} ${styles.enter}`}>
        <span className={styles.spin} aria-hidden="true" />
        <span className={styles.what}>{reconnecting}…</span>
      </span>
    );
  }
  if (!latest) {
    return (
      <span className={styles.tick}>
        <span className={styles.what}>Nothing new yet</span>
      </span>
    );
  }
  return (
    <span key={latest.id} className={`${styles.tick} ${styles.enter}`}>
      {latest.actor && <Face name={latest.actor.name} hue={latest.actor.hue} size={22} />}{" "}
      <span className={styles.what}>{latest.text}</span> <time className={styles.time}>{latest.ago}</time>
    </span>
  );
}

import styles from "./big-screen-art.component.module.css";

/** A computer, drawn from the mark itself: its four corners, the top right one red, and its red dot. */
export function BigScreenArt() {
  return (
    <svg className={styles.art} viewBox="0 0 160 120" aria-hidden="true">
      <rect className={styles.frame} x="8" y="8" width="144" height="86" rx="6" />
      <polyline className={styles.corner} points="30,22 22,22 22,30" />
      <polyline className={styles.red} points="130,22 138,22 138,30" />
      <polyline className={styles.corner} points="30,80 22,80 22,72" />
      <polyline className={styles.corner} points="130,80 138,80 138,72" />
      <circle className={styles.dot} cx="80" cy="51" r="14" />
      <path className={styles.frame} d="M64 112h32M80 94v18" />
    </svg>
  );
}

import { Wordmark } from "@shared/components/wordmark";
import styles from "./header.component.module.css";
import type { HeaderProps } from "./types/header.types";

/**
 * The room's header, full width and see-through: the logo at the left, the activity in the middle,
 * people and my account at the right.
 */
export function Header({ middle, right }: HeaderProps) {
  return (
    <header className={styles.header}>
      <span className={styles.logo}>
        <Wordmark height={32} />
      </span>
      <div className={styles.middle}>{middle}</div>
      <div className={styles.right}>{right}</div>
    </header>
  );
}

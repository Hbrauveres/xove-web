import styles from "./settings-hint.component.module.css";
import type { SettingsHintProps } from "./types/settings-hint.types";

/** A muted line in the settings: what a control does, or why it's empty. */
export function SettingsHint({ children }: SettingsHintProps) {
  return <p className={styles.hint}>{children}</p>;
}

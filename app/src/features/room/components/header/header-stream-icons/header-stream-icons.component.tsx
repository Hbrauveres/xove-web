import { Icon } from "@shared/components/icon";
import styles from "./header-stream-icons.component.module.css";
import type { HeaderStreamIconsProps } from "./types/header-stream-icons.types";

/** What a person shares, as small red icons at the end of their row; the line under the name says it in words. */
export function HeaderStreamIcons({ kinds }: HeaderStreamIconsProps) {
  return (
    <span className={styles.icons} aria-hidden="true">
      {kinds.map((kind) => (
        <span key={kind} className={styles.icon}>
          <Icon name={`stream-${kind}`} size={14} />
        </span>
      ))}
    </span>
  );
}

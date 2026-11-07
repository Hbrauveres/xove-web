import styles from "./stage-bar-menu.component.module.css";
import type { StageBarMenuProps } from "./types/stage-bar-menu.types";

/**
 * A menu over the stage's bar, opening above the button it belongs to (its holder places it): Go
 * live's, ending at its right; "…"'s, centred on the picture. A line (`<hr />`) parts its groups.
 */
export function StageBarMenu({ children, centred, ...rest }: StageBarMenuProps) {
  return (
    <div className={styles.menu} data-centred={centred || undefined} {...rest}>
      {children}
    </div>
  );
}

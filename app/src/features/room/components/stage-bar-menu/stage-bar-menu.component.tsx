import styles from "./stage-bar-menu.component.module.css";
import type { StageBarMenuProps } from "./types/stage-bar-menu.types";

/**
 * A menu over the stage's bar, opening above the button it belongs to (its holder places it): Go
 * live's, a menu ending at its right; "…"'s, a group of rows and sliders centred on the picture. A
 * line (`<hr />`) parts its groups.
 */
export function StageBarMenu({ kind, children, centred, ...rest }: StageBarMenuProps) {
  const shared = { className: styles.menu, "data-centred": centred || undefined, ...rest };
  return kind === "group" ? (
    <fieldset {...shared}>{children}</fieldset>
  ) : (
    <div role="menu" {...shared}>
      {children}
    </div>
  );
}

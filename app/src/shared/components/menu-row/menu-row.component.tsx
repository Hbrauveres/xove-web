import { Link } from "react-router";
import { Icon } from "@shared/components/icon";
import { Tooltip } from "@shared/components/tooltip";
import { toastStore } from "@shared/stores/toast-store";
import styles from "./menu-row.component.module.css";
import type { MenuRowProps } from "./types/menu-row.types";

/** One action in a menu: its icon and its words. A link when it goes to a page, a button otherwise. */
export function MenuRow({ icon, label, to, onPick, unavailable, role }: MenuRowProps) {
  if (to !== undefined) {
    return (
      <Link to={to} role={role} className={styles.row}>
        <Icon name={icon} />
        {label}
      </Link>
    );
  }
  return (
    <Tooltip text={unavailable}>
      <button
        type="button"
        role={role}
        className={styles.row}
        aria-disabled={unavailable ? true : undefined}
        onClick={() => (unavailable ? toastStore.show(unavailable, <Icon name={icon} size={20} />) : onPick?.())}
      >
        <Icon name={icon} />
        {label}
      </button>
    </Tooltip>
  );
}

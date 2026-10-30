import styles from "./switch.component.module.css";
import type { SwitchProps } from "./types/switch.types";

/** A setting turned on and off, with its words beside it: one line. */
export function Switch({ label, checked, onToggle, unavailable, className, ref, ...row }: SwitchProps) {
  return (
    <label ref={ref} className={className ? `${styles.row} ${className}` : styles.row} {...row}>
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        className={styles.switch}
        aria-label={label}
        aria-checked={checked}
        aria-disabled={unavailable || undefined}
        onClick={onToggle}
      >
        <i />
      </button>
    </label>
  );
}

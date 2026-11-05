import styles from "./control-label.component.module.css";
import type { ControlLabelProps } from "./types/control-label.types";

/** The name over a control in a panel (Quality, Mode, Camera): small capitals, muted. */
export function ControlLabel({ className, children }: ControlLabelProps) {
  return <p className={className ? `${styles.label} ${className}` : styles.label}>{children}</p>;
}

import { useId } from "react";
import styles from "./field.component.module.css";
import type { FieldProps } from "./types/field.types";

/**
 * A text field: its label starting exactly at the box's border, the box, and under it a counter
 * when it has a length limit, with the form's button at the row's end.
 */
export function Field({ label, hint, value, onChange, maxLength, action, id, ...rest }: FieldProps) {
  const own = useId();
  const box = id ?? own;
  return (
    <div className={styles.field}>
      <label htmlFor={box} className={styles.label}>
        {label} {hint && <span className={styles.hint}>{hint}</span>}
      </label>
      <textarea
        id={box}
        className={styles.box}
        maxLength={maxLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...rest}
      />
      <div className={styles.row}>
        {maxLength !== undefined && (
          <span className={styles.counter}>
            {value.length}/{maxLength}
          </span>
        )}
        {action}
      </div>
    </div>
  );
}

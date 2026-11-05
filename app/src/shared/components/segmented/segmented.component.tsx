import { useId } from "react";
import { Tooltip } from "@shared/components/tooltip";
import type { CssVars } from "@shared/types/css-vars.types";
import styles from "./segmented.component.module.css";
import type { SegmentedProps } from "./types/segmented.types";

/**
 * The app's segmented control (Quality, Mode): real radios drawn as a track with a dark pill that
 * slides to the chosen option. An option pointed at gets a soft horizontal light; the chosen one
 * doesn't react. The arrow keys move the choice, with one tab stop, as any radio group's.
 */
export function Segmented<T extends string>({ label, options, value, onChange, disabled = false }: SegmentedProps<T>) {
  const name = useId();
  const at = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const place: CssVars = { "--n": options.length, "--i": at };
  return (
    <div role="radiogroup" aria-label={label} className={styles.seg} style={place}>
      <span className={styles.pill} aria-hidden="true" />
      {options.map((o, i) => (
        <label key={o.value} className={styles.option}>
          {/* Over the whole option, so its tooltip and focus ring are the option's. */}
          <Tooltip text={o.title}>
            <input
              type="radio"
              className={styles.input}
              name={name}
              value={o.value}
              checked={i === at}
              disabled={disabled}
              onChange={() => onChange(o.value)}
            />
          </Tooltip>
          {o.label}
        </label>
      ))}
    </div>
  );
}

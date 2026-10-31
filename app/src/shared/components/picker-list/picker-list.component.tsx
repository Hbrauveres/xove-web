import { Tooltip } from "@shared/components/tooltip";
import type { CssVars } from "@shared/types/css-vars.types";
import styles from "./picker-list.component.module.css";
import type { PickerListProps } from "./types/picker-list.types";

/** The picker's options, unrolling from its pill; the nearest to the pill appears first. */
export function PickerList<T extends string>({
  ref,
  id,
  label,
  options,
  open,
  unrolled,
  up,
  onPick,
}: PickerListProps<T>) {
  return (
    <div
      ref={ref}
      id={id}
      role="menu"
      aria-label={label}
      className={styles.list}
      data-unroll={(open && unrolled) || undefined}
      data-up={up || undefined}
      // Rolling back: still drawn, out of reach.
      aria-hidden={!open || undefined}
      inert={!open || undefined}
    >
      {options.map((o, i) => {
        const order: CssVars = { "--k": up ? options.length - 1 - i : i };
        return (
          <Tooltip key={o.value} text={o.label}>
            <button
              type="button"
              role="menuitemradio"
              aria-checked="false"
              className={styles.option}
              style={order}
              onClick={() => onPick(o.value)}
            >
              <span className={styles.name}>{o.label}</span>
            </button>
          </Tooltip>
        );
      })}
    </div>
  );
}

import styles from "./count-chip.component.module.css";
import type { CountChipProps } from "./types/count-chip.types";

/** A number in a heading: a chip centred with the heading's text, neutral, or red when it needs you. */
export function CountChip({ count, tone = "neutral" }: CountChipProps) {
  return (
    <span className={styles.chip} data-tone={tone}>
      {count}
    </span>
  );
}

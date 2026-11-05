import { CountChip } from "@shared/components/count-chip";
import styles from "./section-heading.component.module.css";
import type { SectionHeadingProps } from "./types/section-heading.types";

/** What starts a part of a page: capitals, no line, and how many it holds in a chip. */
export function SectionHeading({ id, className, children, count, attention = false }: SectionHeadingProps) {
  return (
    <h2 id={id} className={className ? `${styles.heading} ${className}` : styles.heading}>
      {children}
      {count !== undefined && <CountChip count={count} tone={attention ? "attention" : "neutral"} />}
    </h2>
  );
}

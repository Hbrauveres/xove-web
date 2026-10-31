import styles from "./dropdown-section.component.module.css";
import type { DropdownSectionProps } from "./types/dropdown-section.types";

/** One frosted section of a dropdown; `scroll` for a list that may be long. */
export function DropdownSection({ scroll = false, className, children }: DropdownSectionProps) {
  return (
    <div className={[styles.section, scroll ? styles.scroll : "", className].filter(Boolean).join(" ")}>{children}</div>
  );
}

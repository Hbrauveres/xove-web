import styles from "./page-text.component.module.css";
import type { PageTextProps } from "./types/page-text.types";

/** A page's words beside its heading: the lead under it, or a quiet note. */
export function PageText({ variant, children, className }: PageTextProps) {
  return <p className={[styles.text, styles[variant], className].filter(Boolean).join(" ")}>{children}</p>;
}

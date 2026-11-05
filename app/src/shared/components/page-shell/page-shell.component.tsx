import styles from "./page-shell.component.module.css";
import type { PageShellProps } from "./types/page-shell.types";

/** A page on its own: a frame centred in the window; for home and form, a column in it; for a message, its line. */
export function PageShell({ variant, labelledBy, children, ...rest }: PageShellProps) {
  const column = variant === "home" || variant === "form";
  return (
    <main className={`${styles.frame} ${styles[variant]}`} {...rest}>
      {column && (
        <section className={styles.column} aria-labelledby={labelledBy}>
          {children}
        </section>
      )}
      {/* Said once by screen readers, as it changes. */}
      {variant === "message" && <output>{children}</output>}
      {variant === "waiting" && children}
    </main>
  );
}

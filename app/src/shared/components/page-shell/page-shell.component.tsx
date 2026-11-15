import styles from "./page-shell.component.module.css";
import type { PageShellProps } from "./types/page-shell.types";

/** A page on its own: a centred column (home, form), a line (message), or a column from the top (wide). */
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
      {variant === "wide" && <div className={styles.wideColumn}>{children}</div>}
    </main>
  );
}

import styles from "./page-shell.component.module.css";
import type { PageShellProps } from "./types/page-shell.types";

/** A page on its own: a centred column (home, form), a line (message), or a column from the top (wide). */
export function PageShell({ variant, labelledBy, bar, children, ...rest }: PageShellProps) {
  const column = variant === "home" || variant === "form";
  // A wide page's bar is the page's banner: above its main region, not inside it.
  if (variant === "wide")
    return (
      <div className={`${styles.frame} ${styles.wide}`} {...rest}>
        <div className={styles.wideColumn}>
          {bar}
          <main>{children}</main>
        </div>
      </div>
    );
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

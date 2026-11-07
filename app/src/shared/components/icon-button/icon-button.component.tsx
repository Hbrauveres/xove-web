import styles from "./icon-button.component.module.css";
import type { IconButtonProps } from "./types/icon-button.types";

/** One of the app's icon buttons: a round one in one of its two sizes, or one for another purpose. */
export function IconButton({ variant, size, live, unavailable, className, children, ref, ...button }: IconButtonProps) {
  const own = [styles[variant], size && styles[size], live && styles.live, unavailable && styles.unavailable, className]
    .filter(Boolean)
    .join(" ");
  return (
    <button ref={ref} type="button" className={own} {...(unavailable ? { "aria-disabled": true } : {})} {...button}>
      {children}
    </button>
  );
}

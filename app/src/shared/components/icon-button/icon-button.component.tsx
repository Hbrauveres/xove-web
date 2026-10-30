import styles from "./icon-button.component.module.css";
import type { IconButtonProps } from "./types/icon-button.types";

/** One of the app's icon buttons, in the look of where it sits; the player's comes in its pill. */
export function IconButton({
  variant,
  live,
  unavailable,
  open,
  around,
  className,
  children,
  ref,
  ...button
}: IconButtonProps) {
  const own = styles[variant];
  const element = (
    <button ref={ref} type="button" className={className ? `${own} ${className}` : own} {...button}>
      {children}
    </button>
  );
  if (variant !== "player") return element;
  const pill = [styles.pill, live && styles.live, unavailable && styles.unavailable].filter(Boolean).join(" ");
  return (
    <div className={pill} data-open={open || undefined}>
      {around ? around(element) : element}
    </div>
  );
}

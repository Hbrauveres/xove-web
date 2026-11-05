import styles from "./button.component.module.css";
import type { ButtonProps } from "./types/button.types";

/** The app's text button: primary, danger or ghost, in two sizes. */
export function Button({ variant = "primary", size = "md", className, ...rest }: ButtonProps) {
  const classes = [styles.button, styles[variant], styles[size], className].filter(Boolean).join(" ");
  return <button type="button" className={classes} {...rest} />;
}

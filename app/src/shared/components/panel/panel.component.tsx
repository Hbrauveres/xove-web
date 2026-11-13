import styles from "./panel.component.module.css";
import type { PanelProps } from "./types/panel.types";

/**
 * The app's one panel: one piece of glass with 16 px corners, dimming what's behind it so its text
 * stays readable. Its sections (PanelSection) sit on it, parted by a hairline. What uses it places
 * and moves it.
 */
export function Panel({ as = "div", className, children, ref, ...rest }: PanelProps) {
  const look = className ? `${styles.panel} ${className}` : styles.panel;
  // A status that speaks its changes: nothing holds on to it, so it takes no ref.
  if (as === "output") {
    return (
      <output className={look} {...rest}>
        {children}
      </output>
    );
  }
  // Beside the page, which stays usable: open as it's drawn, its browser look reset in the stylesheet.
  if (as === "dialog") {
    return (
      <dialog open className={look} {...rest}>
        {children}
      </dialog>
    );
  }
  const Tag = as;
  return (
    <Tag ref={ref} className={look} {...rest}>
      {children}
    </Tag>
  );
}

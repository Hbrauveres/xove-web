import styles from "./panel.component.module.css";
import type { PanelProps } from "./types/panel.types";

/**
 * The app's one panel: one piece of glass with 16 px corners, dimming what's behind it so its text
 * stays readable. Its sections (PanelSection) sit on it, parted by a hairline. What uses it places
 * and moves it.
 */
export function Panel({ as: Tag = "div", className, children, ...rest }: PanelProps) {
  return (
    <Tag className={className ? `${styles.panel} ${className}` : styles.panel} {...rest}>
      {children}
    </Tag>
  );
}

import styles from "./panel.component.module.css";
import type { PanelProps } from "./types/panel.types";

/**
 * The app's one panel: glass with 16 px corners, dimming what's behind it so its text stays
 * readable. With cuts, it's sections stacked with a clear cut between them, each its own glass.
 * What uses it places and moves it.
 */
export function Panel({ cuts = false, as: Tag = "div", className, children, ...rest }: PanelProps) {
  const look = cuts ? styles.cuts : styles.panel;
  return (
    <Tag className={className ? `${look} ${className}` : look} {...rest}>
      {children}
    </Tag>
  );
}

import type { AmbilightPrefs } from "@services/preferences-service";
import styles from "./CornerGlow.module.css";

/**
 * Nobody live (spec 0123): each viewfinder corner glows outward in its own colour (the
 * top right red, as in the logo). Each light is an L like the mark, heavily blurred by the
 * browser: a blur fades on a bell curve that never ends in an edge, and follows the L's shape.
 * Behind the stage, which hides the inside; still, so it costs nothing while shown. It follows
 * the ambilight's switch and brightness.
 */
export function CornerGlow({ prefs }: { prefs: AmbilightPrefs }) {
  return (
    <span
      className={styles.glow}
      data-corner-glow
      style={{ opacity: prefs.on ? prefs.brightness : 0 }}
      aria-hidden="true"
    >
      {(["tl", "tr", "bl", "br"] as const).map((at) => (
        <i key={at} data-at={at} />
      ))}
    </span>
  );
}

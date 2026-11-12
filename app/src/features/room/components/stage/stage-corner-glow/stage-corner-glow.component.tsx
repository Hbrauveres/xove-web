import { CORNERS } from "../../../constants/corners.constants";
import styles from "./stage-corner-glow.component.module.css";
import type { StageCornerGlowProps } from "./types/stage-corner-glow.types";

/**
 * Nobody live: each viewfinder corner glows outward in its own colour (the top right red, as in
 * the logo). Each light is an L like the mark, heavily blurred by the browser, behind the stage,
 * which hides the inside; still, so it costs nothing while shown. It follows the ambilight's switch
 * and brightness.
 */
export function StageCornerGlow({ prefs }: StageCornerGlowProps) {
  return (
    <span className={styles.glow} style={{ opacity: prefs.on ? prefs.brightness : 0 }} aria-hidden="true">
      {CORNERS.map((at) => (
        <i key={at} data-at={at} />
      ))}
    </span>
  );
}

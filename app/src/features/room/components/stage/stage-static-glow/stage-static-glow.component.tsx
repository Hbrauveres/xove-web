import { useTurnOn } from "../../../hooks/use-turn-on.hook";
import { useStaticGlow } from "./hooks/use-static-glow.hook";
import styles from "./stage-static-glow.component.module.css";
import type { StageStaticGlowProps } from "./types/stage-static-glow.types";

/**
 * The empty stage's light on the wall: the static's bands light it as they roll, the way a TV's
 * picture does, never brighter than the static itself. The browser stretches and blurs a small
 * canvas behind the stage, which hides the middle, so only the light past its edges shows. It
 * follows the ambilight's switch and brightness.
 */
export function StageStaticGlow({ prefs, turnOn }: StageStaticGlowProps) {
  const { canvas, stage: glow } = useStaticGlow(prefs.on);
  // The TV turning on lights the wall too, once, in time with the stage's flash.
  const { turningOn, ended } = useTurnOn(turnOn);
  return (
    <span ref={glow} className={styles.glow} style={{ opacity: prefs.on ? prefs.brightness : 0 }} aria-hidden="true">
      <canvas ref={canvas} className={styles.canvas} />
      {turningOn && <i className={styles.flash} onAnimationEnd={ended} />}
    </span>
  );
}

import { useStaticNoise } from "./hooks/use-static-noise.hook";
import styles from "./stage-static-noise.component.module.css";

/**
 * A TV's static behind the empty stage: snow in horizontal bands rolling slowly down, dark and
 * faded so it never competes with the way to start, behind a gently curved glass, as a 90s TV's.
 * Still for reduced motion.
 */
export function StageStaticNoise() {
  const canvas = useStaticNoise();
  return (
    <span className={styles.static} aria-hidden="true">
      <canvas ref={canvas} className={styles.canvas} />
      <span className={styles.glass} />
    </span>
  );
}

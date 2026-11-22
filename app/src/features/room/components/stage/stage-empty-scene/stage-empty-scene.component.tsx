import { EYE_BOX, EYE_DOT, EYE_RING } from "./constants/eye.constants";
import styles from "./stage-empty-scene.component.module.css";
import type { StageEmptySceneProps } from "./types/stage-empty-scene.types";

/**
 * Behind the empty stage: a dark sky, the eye of Xovê's mark (its ring and dot, the icon mark's
 * geometry) as one near-black silhouette cut in half by the horizon and rising out of the dark, a thin
 * red horizon with a soft haze, and a red synthwave grid sliding toward us without end. Only
 * transforms and opacity move: nothing is redrawn per frame.
 */
export function StageEmptyScene({ ref }: StageEmptySceneProps) {
  return (
    <div ref={ref} className={styles.scene} aria-hidden="true">
      <div className={styles.sky} />
      <div className={styles.haze} />
      <svg
        className={styles.eye}
        viewBox={`0 0 ${EYE_BOX.width} ${EYE_BOX.height}`}
        data-part="eye"
      >
        <circle cx={EYE_RING.cx} cy={EYE_RING.cy} r={EYE_RING.r} strokeWidth={EYE_RING.width} className={styles.ring} />
        <circle cx={EYE_DOT.cx} cy={EYE_DOT.cy} r={EYE_DOT.r} className={styles.dot} />
      </svg>
      <div className={styles.floor}>
        <div className={styles.plane}>
          <div className={styles.grid} data-part="grid" />
        </div>
      </div>
      <div className={styles.horizon} />
    </div>
  );
}

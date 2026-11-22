import { StageGoLive } from "../../stage-controls/stage-go-live";
import { CORNERS } from "./constants/corners.constants";
import styles from "./stage-empty-stage.component.module.css";
import type { StageEmptyStageProps } from "./types/stage-empty-stage.types";

/**
 * Nobody is live: the viewfinder corners (the top right red, as in the logo) and one way to start,
 * the room's own Go live with its menu, on the floor; no words, since the pill says it. Who's here
 * and the seats are said once, below.
 */
export function StageEmptyStage({ canShareScreen, onStart, onSettings }: StageEmptyStageProps) {
  return (
    <div className={styles.empty}>
      {CORNERS.map((at) => (
        <span key={at} className={styles.corner} data-at={at} data-neon={at === "tr" || undefined} aria-hidden="true" />
      ))}
      <div className={styles.start}>
        <StageGoLive canShareScreen={canShareScreen} onStart={onStart} onSettings={onSettings} />
      </div>
    </div>
  );
}

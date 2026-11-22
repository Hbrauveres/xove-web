import { useRef } from "react";
import { StageGoLive } from "../../stage-controls/stage-go-live";
import { StageEmptyScene } from "../stage-empty-scene";
import { CORNERS, NEON_CORNER } from "./constants/corners.constants";
import { usePointerShift } from "./hooks/use-pointer-shift.hook";
import styles from "./stage-empty-stage.component.module.css";
import type { StageEmptyStageProps } from "./types/stage-empty-stage.types";

/**
 * Nobody is live: a synthwave scene (the eye of Xovê's mark on the horizon, a red grid sliding toward
 * us), the viewfinder corners with the top right one a flickering neon tube, and one way to start,
 * the room's own Go live with its menu, on the floor; no words, since the pill says it. Who's here and
 * the seats are said once, below. The scene shifts a touch with the pointer.
 */
export function StageEmptyStage({ canShareScreen, onStart, onSettings }: StageEmptyStageProps) {
  const scene = useRef<HTMLDivElement>(null);
  const shift = usePointerShift(scene);
  return (
    <div className={styles.empty} {...shift}>
      <StageEmptyScene ref={scene} />
      {CORNERS.map((at) => (
        <span
          key={at}
          className={styles.corner}
          data-at={at}
          data-neon={at === NEON_CORNER || undefined}
          aria-hidden="true"
        />
      ))}
      <div className={styles.start}>
        <StageGoLive canShareScreen={canShareScreen} onStart={onStart} onSettings={onSettings} menuOverButton />
      </div>
    </div>
  );
}

import { Headline } from "@shared/components/headline";
import { CORNERS } from "./constants/corners.constants";
import { StageStartButtons } from "../stage-start-buttons";
import styles from "./stage-empty-stage.component.module.css";
import type { StageEmptyStageProps } from "./types/stage-empty-stage.types";

/**
 * Nobody is live: the viewfinder corners (the top right red, as in the logo), a still "Standby"
 * where there's room, and the ways to start; who's here and the seats are said once, below.
 */
export function StageEmptyStage({ canShareScreen = true, onStart }: StageEmptyStageProps) {
  return (
    <div className={styles.empty}>
      {CORNERS.map((at) => (
        <span key={at} className={styles.corner} data-at={at} aria-hidden="true" />
      ))}
      <span className={styles.readout} data-at="tl">
        <i className={styles.dot} aria-hidden="true" />
        Standby
      </span>
      <div className={styles.focus}>
        <Headline level="section" className={styles.title}>
          Go <em>live</em>
        </Headline>
        {/* An invitation, not an order: a TV asking what's on. */}
        <p className={styles.copy}>What's on today?</p>
        <StageStartButtons canShareScreen={canShareScreen} onStart={onStart} />
      </div>
    </div>
  );
}

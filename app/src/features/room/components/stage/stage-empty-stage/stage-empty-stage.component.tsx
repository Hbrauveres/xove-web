import { useEffect } from "react";
import { Headline } from "@shared/components/headline";
import { CORNERS } from "../../../constants/corners.constants";
import { useTurnOn } from "../../../hooks/use-turn-on.hook";
import { StageStartButtons } from "../stage-start-buttons";
import { StageStaticNoise } from "../stage-static-noise";
import styles from "./stage-empty-stage.component.module.css";
import type { StageEmptyStageProps } from "./types/stage-empty-stage.types";

/**
 * Nobody is live: a TV on standby. Its viewfinder corners (the top right red, as in the logo), a
 * still "Standby" where there's room, and the ways to start, over the TV's static; who's here and
 * the seats are said once, below. The first time it stands by in a visit, the TV turns on.
 */
export function StageEmptyStage({ canShareScreen = true, onStart, turnOn, onStandby }: StageEmptyStageProps) {
  const { turningOn, ended } = useTurnOn(turnOn);
  useEffect(() => onStandby(), [onStandby]);

  return (
    <div className={styles.empty}>
      <StageStaticNoise />
      {CORNERS.map((at) => (
        <span key={at} className={styles.corner} data-at={at} aria-hidden="true" />
      ))}
      <span className={styles.readout} data-at="tl">
        <i className={styles.dot} aria-hidden="true" />
        Standby
      </span>
      {turningOn && (
        <span
          className={styles.intro}
          aria-hidden="true"
          onAnimationEnd={(e) => e.target === e.currentTarget && ended()}
        >
          <i data-part="flare" />
          <i data-part="band" />
          <i data-part="line" />
          <i data-part="dot" />
        </span>
      )}
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

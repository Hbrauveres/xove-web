import { ActionPill } from "@shared/components/action-pill";
import { Slider } from "@shared/components/slider";
import { Tooltip } from "@shared/components/tooltip";
import { StageVoiceAudio } from "../../stage/stage-voice-audio";
import { useHearCountdown } from "./hooks/use-hear-countdown.hook";
import styles from "./settings-mic-test.component.module.css";
import type { SettingsMicTestProps } from "./types/settings-mic-test.types";

/**
 * The mic's level, one quiet row: a threshold slider whose line is the sensitivity, the live level
 * in its track (green past the line, sent; faint under it), and Test, which plays my mic back to me
 * for a few seconds.
 */
export function SettingsMicTest({ level, track, sensitivity, onSensitivity }: SettingsMicTestProps) {
  const { left, start, stop } = useHearCountdown();
  const hearing = Boolean(left > 0 && track);
  return (
    <div className={styles.row}>
      <Tooltip text={"Sensitivity: sound left of the line isn't sent"}>
        <Slider
          variant="threshold"
          className={styles.meter}
          min={0}
          max={1}
          step={0.01}
          value={sensitivity}
          level={level}
          sent={Boolean(track) && level >= sensitivity}
          aria-label="Mic sensitivity"
          onChange={(e) => onSensitivity(Number(e.target.value))}
        />
      </Tooltip>
      {/* Disabled, the button gets no pointer: its wrapper takes it, for the tooltip. */}
      <Tooltip text={track ? "Hear yourself for 5 s (use headphones)" : "Turn your voice on to hear yourself"}>
        <span className={styles.hearWrap}>
          <ActionPill
            size="xs"
            fill="dark"
            className={styles.hear}
            disabled={!track}
            aria-pressed={hearing}
            aria-label={hearing ? "Stop hearing yourself" : "Test: hear yourself"}
            onClick={hearing ? stop : start}
          >
            {hearing ? <span className={styles.count}>Stop · {left}</span> : "Test"}
          </ActionPill>
        </span>
      </Tooltip>
      {hearing && track && <StageVoiceAudio track={track} volume={1} muted={false} />}
    </div>
  );
}

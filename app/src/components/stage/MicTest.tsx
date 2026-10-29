import { useEffect, useState, type CSSProperties } from "react";
import type { MediaTrack } from "@services/livekit-service";
import { VoiceAudio } from "./VoiceAudio";
import styles from "./MicTest.module.css";
import { Tooltip } from "../ui/Tooltip";

/** How long "Hear yourself" plays your mic back. */
const HEAR_S = 5;

/**
 * The Voice tab's mic level (spec 0123), one quiet row: the live level on the app's
 * slim track, an upright line on it the sensitivity (sound under it isn't sent: green over it,
 * faint under), and at the end Test, which plays your mic back to you for a few seconds.
 */
export function MicTest({
  level,
  track,
  sensitivity,
  onSensitivity,
}: {
  level: number;
  track?: MediaTrack;
  sensitivity: number;
  onSensitivity: (next: number) => void;
}) {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (left <= 0) return;
    const tick = window.setTimeout(() => setLeft(left - 1), 1000);
    return () => window.clearTimeout(tick);
  }, [left]);
  const hearing = Boolean(left > 0 && track);
  return (
    <div className={styles.row}>
      <div
        className={styles.meter}
        data-sent={(track && level >= sensitivity) || undefined}
        style={
          {
            "--level": `${Math.round(level * 100)}%`,
            "--at": `${sensitivity * 100}%`,
          } as CSSProperties
        }
      >
        <Tooltip text={"Sensitivity: sound left of the line isn't sent"}>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={sensitivity}
            aria-label="Mic sensitivity"
            onChange={(e) => onSensitivity(Number(e.target.value))}
          />
        </Tooltip>
      </div>
      {/* Disabled, the button gets no pointer: its wrapper takes it, for the tooltip. */}
      <Tooltip text={track ? "Hear yourself for 5 s (use headphones)" : "Turn your voice on to hear yourself"}>
        <span className={styles.hearWrap}>
          <button
            type="button"
            className={styles.hear}
            data-on={hearing || undefined}
            disabled={!track}
            aria-pressed={hearing}
            aria-label={hearing ? "Stop hearing yourself" : "Test: hear yourself"}
            onClick={() => setLeft(hearing ? 0 : HEAR_S)}
          >
            {hearing ? <span className={styles.count}>Stop · {left}</span> : "Test"}
          </button>
        </span>
      </Tooltip>
      {hearing && track && <VoiceAudio track={track} volume={1} muted={false} />}
    </div>
  );
}

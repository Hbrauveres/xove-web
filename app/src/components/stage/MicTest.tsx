import { useEffect, useState, type CSSProperties } from "react";
import type { MediaTrack } from "../../types";
import { HeadphonesIcon } from "./icons";
import { VoiceAudio } from "./VoiceAudio";
import styles from "./MicTest.module.css";

/** How long "Hear yourself" plays your mic back. */
const HEAR_S = 5;

/**
 * The Voice tab's mic level (spec 0123 prototype), one quiet row: the live level on the app's
 * slim track, its knob the sensitivity (sound under it isn't sent: green over it, faint under),
 * and at the end a small headphones button that plays your mic back to you for a few seconds.
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
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={sensitivity}
          aria-label="Mic sensitivity"
          title="Sensitivity: sound under the knob isn't sent"
          onChange={(e) => onSensitivity(Number(e.target.value))}
        />
      </div>
      <button
        type="button"
        className={styles.hear}
        data-on={hearing || undefined}
        disabled={!track}
        aria-pressed={hearing}
        aria-label={hearing ? "Stop hearing yourself" : "Hear yourself"}
        title={
          track
            ? "Hear yourself for 5 s (use headphones)"
            : "Turn your voice on to hear yourself"
        }
        onClick={() => setLeft(hearing ? 0 : HEAR_S)}
      >
        {hearing ? (
          <span className={styles.count}>{left}</span>
        ) : (
          <HeadphonesIcon />
        )}
      </button>
      {hearing && track && (
        <VoiceAudio track={track} volume={1} muted={false} />
      )}
    </div>
  );
}

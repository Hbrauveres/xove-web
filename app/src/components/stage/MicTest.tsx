import { useEffect, useState, type CSSProperties } from "react";
import type { MediaTrack } from "../../types";
import { VoiceAudio } from "./VoiceAudio";
import styles from "./MicTest.module.css";

/** How long "Hear yourself" plays your mic back. */
const HEAR_S = 5;

/**
 * The Voice tab's mic test (spec 0123 prototype): the voice's own preview, as the Camera tab
 * shows the camera. Its live level, with the sensitivity line on it (sound under it isn't sent),
 * and a few seconds of your mic played back to you.
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
  // Counts down while it plays; stops when the mic goes.
  useEffect(() => {
    if (left <= 0) return;
    const tick = window.setTimeout(() => setLeft(left - 1), 1000);
    return () => window.clearTimeout(tick);
  }, [left]);
  const hearing = left > 0 && track;
  const sent = level >= sensitivity;
  return (
    <div className={styles.test}>
      <div className={styles.meter} data-sent={(track && sent) || undefined}>
        <i style={{ width: `${Math.round(level * 100)}%` }} />
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={sensitivity}
          aria-label="Mic sensitivity"
          title="Sound under the line isn't sent"
          style={{ "--at": `${sensitivity * 100}%` } as CSSProperties}
          onChange={(e) => onSensitivity(Number(e.target.value))}
        />
      </div>
      <p className={styles.hint}>Drag the line: sound under it isn't sent.</p>
      <div className={styles.row}>
        <button
          type="button"
          className={styles.hear}
          disabled={!track}
          onClick={() => setLeft(hearing ? 0 : HEAR_S)}
        >
          {hearing ? `Stop · ${left}` : "Hear yourself"}
        </button>
        <p className={styles.hint}>
          {track
            ? "Use headphones: it plays your mic back to you."
            : "Turn your voice on to test it."}
        </p>
      </div>
      {hearing && <VoiceAudio track={track} volume={1} muted={false} />}
    </div>
  );
}

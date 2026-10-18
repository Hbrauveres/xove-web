import { useEffect, useState } from "react";
import { loadCameraPrefs, loadSharePrefs } from "../../media/preferences";
import type { Friend, StreamKind } from "../../types";
import { CameraOnIcon, ScreenOffIcon, ScreenOnIcon } from "./icons";
import { showToast } from "../ui/toast";
import styles from "./EmptyStage.module.css";

type Props = {
  canShareScreen?: boolean;
  /** The others in the room, for "Marina and Rafa are here". */
  here?: Friend[];
  onStart?: (kind: StreamKind) => void;
};

/** The time now, as a viewfinder's readout: hours and minutes, ticking each minute. */
function useClock() {
  const read = () =>
    new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  const [now, setNow] = useState(read);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(read()), 15_000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}

/**
 * Nobody is live (spec 0123): the stage as a camera waiting, like Xovê's mark. Thin viewfinder
 * corners (the top right red, as in the logo), a quiet readout (standby and the time), and in a
 * small focus frame the two ways to start; who's here and the seats are said once, below. Where
 * the browser can't share a screen (phones), the camera comes first and the screen is greyed with
 * its reason. Nothing moves but the clock. Prototype (ADR-0070).
 */
export function EmptyStage({
  canShareScreen = true,
  // Prototype: said once, in the row below; dropped by /implement.
  here: _here = [],
  onStart,
}: Props) {
  const now = useClock();
  // What your stream starts at: the screen's settings, or the camera's where screens can't be shared.
  const prefs = canShareScreen ? loadSharePrefs() : loadCameraPrefs();
  const startsAt = `${prefs.quality} · ${prefs.mode}`;
  const screen = (
    <button
      type="button"
      className={canShareScreen ? styles.primary : styles.unavailable}
      aria-disabled={canShareScreen ? undefined : true}
      title={canShareScreen ? undefined : "This browser can't share a screen"}
      onClick={() =>
        canShareScreen
          ? onStart?.("screen")
          : showToast("This browser can't share a screen", <ScreenOffIcon />)
      }
    >
      {canShareScreen ? <ScreenOnIcon /> : <ScreenOffIcon />}
      Share your screen
    </button>
  );
  const camera = (
    <button
      type="button"
      className={canShareScreen ? styles.ghost : styles.primary}
      onClick={() => onStart?.("camera")}
    >
      <CameraOnIcon />
      Turn on your camera
    </button>
  );
  return (
    <div className={styles.empty} data-empty>
      {(["tl", "tr", "bl", "br"] as const).map((at) => (
        <span
          key={at}
          className={styles.corner}
          data-at={at}
          data-mark={at}
          aria-hidden="true"
        />
      ))}
      <span className={styles.readout} data-at="tl">
        <i className={styles.dot} aria-hidden="true" />
        Standby · {now}
      </span>
      {/* The camera's display, still and quiet (spec 0123 prototype): real where it can be (what
          your stream starts at), the rest only drawn; nothing said elsewhere is said again. */}
      <span className={styles.readout} data-at="tr" title="What your stream starts at (Settings)">
        {startsAt}
      </span>
      <span className={styles.meter} data-at="ml" aria-hidden="true">
        {(["L", "R"] as const).map((side) => (
          <span key={side}>
            <span className={styles.bars}>
              {Array.from({ length: 16 }, (_, i) => (
                <i key={i} />
              ))}
            </span>
            {side}
          </span>
        ))}
      </span>
      <span className={styles.tags} data-at="mr" aria-hidden="true">
        <b>16:9</b>
        <span>HD</span>
        <span>Auto</span>
      </span>
      <span className={styles.readout} data-at="bl" aria-hidden="true">
        <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
          <rect x="1.5" y="10" width="2.5" height="4" rx="0.6" />
          <rect x="5.5" y="7" width="2.5" height="7" rx="0.6" />
          <rect x="9.5" y="4" width="2.5" height="10" rx="0.6" />
          <rect x="13.5" y="1.5" width="1.5" height="12.5" rx="0.6" opacity="0.4" />
        </svg>
        Online
      </span>
      <span className={styles.ruler} data-at="bc" aria-hidden="true">
        {Array.from({ length: 41 }, (_, i) => (
          <i key={i} data-major={i % 5 === 0 || undefined} />
        ))}
      </span>
      <div className={styles.focus}>
        <h2 className={styles.title}>Be the first to go live</h2>
        <p className={styles.copy}>
          {canShareScreen
            ? "Share your screen or turn on your camera, and the room sees it at once."
            : "Turn on your camera and the room sees you at once."}
        </p>
        <div className={styles.go}>
          {canShareScreen ? (
            <>
              {screen}
              {camera}
            </>
          ) : (
            <>
              {camera}
              {screen}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
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

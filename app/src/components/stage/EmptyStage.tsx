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
 * corners (the top right red, as in the logo), a quiet readout in the corners (standby and the
 * time, how many are live, who's here), and in a small focus frame the two ways to start. Where
 * the browser can't share a screen (phones), the camera comes first and the screen is greyed with
 * its reason. Nothing moves but the clock. Prototype (ADR-0070).
 */
export function EmptyStage({
  canShareScreen = true,
  here = [],
  onStart,
}: Props) {
  const now = useClock();
  const names = here.map((p) => p.name);
  const who = !names.length
    ? "Nobody else is here yet"
    : names.length === 1
      ? `${names[0]} is here`
      : `${names.slice(0, -1).join(", ")} and ${names.at(-1)} are here`;
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
          aria-hidden="true"
        />
      ))}
      <span className={styles.readout} data-at="tl">
        <i className={styles.dot} aria-hidden="true" />
        Standby · {now}
      </span>
      <span className={styles.readout} data-at="tr">
        0 / 6 live
      </span>
      {here.length > 0 && (
        <span className={styles.readout} data-at="bl">
          <span className={styles.here} aria-hidden="true">
            {here.slice(0, 3).map((p) => (
              <span
                key={p.id}
                className={styles.av}
                style={{ background: `hsl(${p.hue} 42% 36%)` }}
              >
                {p.name.slice(0, 1)}
              </span>
            ))}
          </span>
          <span className={styles.who}>{who}</span>
        </span>
      )}
      <div className={styles.focus}>
        <h2 className={styles.title}>Nobody's live yet</h2>
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

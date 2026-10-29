import { useEffect, useState } from "react";
import type { StreamKind } from "@core/api/api.types";
import { CameraOnIcon, ScreenOffIcon, ScreenOnIcon } from "./icons";
import { showToast } from "../ui/toast";
import styles from "./EmptyStage.module.css";
import { StaticNoise } from "./StaticNoise";
import { tv } from "./staticBands";
import { Tooltip } from "../ui/Tooltip";

type Props = {
  canShareScreen?: boolean;
  onStart?: (kind: StreamKind) => void;
};

/**
 * Nobody is live (spec 0123, calmed in spec 0136): a TV on standby. Its viewfinder corners (the top
 * right red, as in the logo), a still "Standby" where there's room, and the way to start, over the
 * TV's static; who's here and the seats are said once, below. Where the browser can't share a
 * screen, the camera comes first and the screen is the same pill, greyed, saying why;
 * their labels are one word, "Screen" and "Camera"; their spoken names say the act (spec 0138). The first time it stands by in a visit, the TV turns on.
 */
export function EmptyStage({ canShareScreen = true, onStart }: Props) {
  // The TV turning on (spec 0136): only the first time the stage stands by in this visit; once it's
  // on, the last stream stopping doesn't turn it on again. Gone when it ends.
  const [turningOn, setTurningOn] = useState(
    () => !tv.on && !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    tv.on = true;
  }, []);
  const screen = (
    <Tooltip text={canShareScreen ? undefined : "This browser can't share a screen"}>
      <button
        type="button"
        className={canShareScreen ? styles.primary : styles.unavailable}
        aria-disabled={canShareScreen ? undefined : true}
        aria-label="Share your screen"
        onClick={() =>
          canShareScreen ? onStart?.("screen") : showToast("This browser can't share a screen", <ScreenOffIcon />)
        }
      >
        {canShareScreen ? <ScreenOnIcon /> : <ScreenOffIcon />}
        Screen
      </button>
    </Tooltip>
  );
  const camera = (
    <button
      type="button"
      className={canShareScreen ? styles.ghost : styles.primary}
      aria-label="Turn on your camera"
      onClick={() => onStart?.("camera")}
    >
      <CameraOnIcon />
      Camera
    </button>
  );
  return (
    <div className={styles.empty} data-empty>
      <StaticNoise />
      {(["tl", "tr", "bl", "br"] as const).map((at) => (
        <span key={at} className={styles.corner} data-at={at} data-mark={at} aria-hidden="true" />
      ))}
      <span className={styles.readout} data-at="tl">
        <i className={styles.dot} aria-hidden="true" />
        Standby
      </span>
      {turningOn && (
        <span
          className={styles.intro}
          aria-hidden="true"
          onAnimationEnd={(e) => e.target === e.currentTarget && setTurningOn(false)}
        >
          <i data-part="flare" />
          <i data-part="band" />
          <i data-part="line" />
          <i data-part="dot" />
        </span>
      )}
      <div className={styles.focus}>
        <h2 className={styles.title}>
          Go <em>live</em>
        </h2>
        {/* An invitation, not an order (spec 0138): a TV asking what's on. */}
        <p className={styles.copy}>What's on today?</p>
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

import type { StreamKind } from "../../types";
import { CameraOnIcon, ScreenOffIcon, ScreenOnIcon } from "./icons";
import { showToast } from "../ui/toast";
import styles from "./EmptyStage.module.css";
import { StaticNoise } from "./StaticNoise";
import { useState } from "react";
import { Tooltip } from "../ui/Tooltip";

type Props = {
  canShareScreen?: boolean;
  onStart?: (kind: StreamKind) => void;
};

/**
 * Nobody is live (spec 0123, calmed in spec 0136): the stage as a camera waiting, like Xovê's mark.
 * Only its viewfinder corners (the top right red, as in the logo), a still "Standby" where there's
 * room, and the way to start; who's here and the seats are said once, below. Where the browser
 * can't share a screen (phones), the camera comes first and the screen is a small greyed button
 * saying why. Nothing moves.
 */
export function EmptyStage({
  canShareScreen = true,
  onStart,
}: Props) {
  // The TV turning on, once, as the stage appears (spec 0136); gone when it ends.
  const [turningOn, setTurningOn] = useState(() => !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
  const screen = (
    <Tooltip text={canShareScreen ? undefined : "This browser can't share a screen"}>
      <button
        type="button"
        className={canShareScreen ? styles.primary : styles.unavailable}
        aria-disabled={canShareScreen ? undefined : true}
        aria-label={canShareScreen ? undefined : "Share your screen"}
        onClick={() =>
          canShareScreen ? onStart?.("screen") : showToast("This browser can't share a screen", <ScreenOffIcon />)
        }
      >
        {canShareScreen ? <ScreenOnIcon /> : <ScreenOffIcon />}
        {canShareScreen && "Share your screen"}
      </button>
    </Tooltip>
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
      <StaticNoise />
      {(["tl", "tr", "bl", "br"] as const).map((at) => (
        <span key={at} className={styles.corner} data-at={at} data-mark={at} aria-hidden="true" />
      ))}
      <span className={styles.readout} data-at="tl">
        <i className={styles.dot} aria-hidden="true" />
        Standby
      </span>
      {turningOn && (
        <span className={styles.intro} aria-hidden="true" onAnimationEnd={(e) => e.target === e.currentTarget && setTurningOn(false)}>
          <i data-part="flare" />
          <i data-part="band" />
          <i data-part="line" />
          <i data-part="dot" />
        </span>
      )}
      <div className={styles.focus}>
        <h2 className={styles.title}>Be the first to go live</h2>
        <p className={styles.copy}>
          {canShareScreen
            ? "Share your screen or turn on your camera."
            : "Turn on your camera."}
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

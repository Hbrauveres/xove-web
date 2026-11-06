import { Icon } from "@shared/components/icon";
import { Tooltip } from "@shared/components/tooltip";
import { toastStore } from "@shared/stores/toast-store";
import { NO_SCREEN } from "./constants/stage-start-buttons.constants";
import styles from "./stage-start-buttons.component.module.css";
import type { StageStartButtonsProps } from "./types/stage-start-buttons.types";

/**
 * The ways to start, on the empty stage: the screen first and the camera beside it. Where the
 * browser can't share a screen, the camera comes first and the screen is the same pill, greyed,
 * saying why. Their labels are one word, "Screen" and "Camera"; their spoken names say the act.
 */
export function StageStartButtons({ canShareScreen = true, onStart }: StageStartButtonsProps) {
  const screen = (
    <Tooltip key="screen" text={canShareScreen ? undefined : NO_SCREEN}>
      <button
        type="button"
        className={canShareScreen ? styles.primary : styles.unavailable}
        aria-disabled={canShareScreen ? undefined : true}
        aria-label="Share your screen"
        onClick={() =>
          canShareScreen ? onStart?.("screen") : toastStore.show(NO_SCREEN, <Icon name="screen-off" size={20} />)
        }
      >
        <Icon name={canShareScreen ? "screen-on" : "screen-off"} size={20} />
        Screen
      </button>
    </Tooltip>
  );
  const camera = (
    <button
      key="camera"
      type="button"
      className={canShareScreen ? styles.ghost : styles.primary}
      aria-label="Turn on your camera"
      onClick={() => onStart?.("camera")}
    >
      <Icon name="camera-on" size={20} />
      Camera
    </button>
  );
  return <div className={styles.go}>{canShareScreen ? [screen, camera] : [camera, screen]}</div>;
}

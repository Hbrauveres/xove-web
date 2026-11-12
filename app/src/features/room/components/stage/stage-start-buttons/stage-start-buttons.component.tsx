import { ActionPill } from "@shared/components/action-pill";
import { Icon } from "@shared/components/icon";
import { Tooltip } from "@shared/components/tooltip";
import { toastStore } from "@shared/stores/toast-store";
import { NO_SCREEN } from "../../../constants/stream-words.constants";
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
      <ActionPill
        size="l"
        fill="red"
        lead={canShareScreen ? "screen-on" : "screen-off"}
        unavailable={!canShareScreen}
        aria-label="Share your screen"
        onClick={() =>
          canShareScreen ? onStart?.("screen") : toastStore.show(NO_SCREEN, <Icon name="screen-off" size={20} />)
        }
      >
        Screen
      </ActionPill>
    </Tooltip>
  );
  const camera = (
    <ActionPill
      key="camera"
      size="l"
      fill={canShareScreen ? "soft" : "red"}
      lead="camera-on"
      aria-label="Turn on your camera"
      onClick={() => onStart?.("camera")}
    >
      Camera
    </ActionPill>
  );
  return <div className={styles.go}>{canShareScreen ? [screen, camera] : [camera, screen]}</div>;
}

import { IconButton } from "@shared/components/icon-button";
import { Icon } from "@shared/components/icon";
import styles from "./stage-stage-overlay.component.module.css";
import type { StageStageOverlayProps } from "./types/stage-stage-overlay.types";
import { Tooltip } from "@shared/components/tooltip";

/**
 * What sits over the video: the fullscreen button. Who is live, and for how long, is in the
 * info row under the stage.
 */
export function StageStageOverlay({ fullscreen, onFullscreen }: StageStageOverlayProps) {
  const label = fullscreen ? "Exit fullscreen" : "Fullscreen";
  return (
    <div className={styles.overlay} data-overlay>
      <div className={styles.top}>
        <Tooltip text={label}>
          <IconButton variant="round" size="m" onClick={onFullscreen} aria-label={label}>
            <Icon name={fullscreen ? "fullscreen-exit" : "fullscreen-enter"} size={16} />
          </IconButton>
        </Tooltip>
      </div>
    </div>
  );
}

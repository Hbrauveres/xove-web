import { Icon } from "@shared/components/icon";
import styles from "./StageOverlay.module.css";
import { Tooltip } from "../ui/Tooltip";

type Props = {
  /** The player is fullscreen: the button leaves it. */
  fullscreen: boolean;
  onFullscreen: () => void;
};

/**
 * What sits over the video: the fullscreen button. Who is live, and for how long, is in the
 * info row under the stage (spec 0104).
 */
export function StageOverlay({ fullscreen, onFullscreen }: Props) {
  const label = fullscreen ? "Exit fullscreen" : "Fullscreen";
  return (
    <div className={styles.overlay} data-overlay>
      <div className={styles.top}>
        <Tooltip text={label}>
          <button type="button" className={styles.iconButton} onClick={onFullscreen} aria-label={label}>
            <Icon name={fullscreen ? "fullscreen-exit" : "fullscreen-enter"} size={16} />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}

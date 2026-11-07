import { Icon } from "@shared/components/icon";
import { IconButton } from "@shared/components/icon-button";
import { Tooltip } from "@shared/components/tooltip";
import { SETTINGS } from "../../constants/stream-words.constants";
import { useSettingsAnchor } from "../../hooks/use-settings-anchor.hook";
import { StageStreamButton } from "../stage-stream-button";
import { usePinnedRow } from "./hooks/use-pinned-row.hook";
import styles from "./stage-player-buttons.component.module.css";
import type { StagePlayerButtonsProps } from "./types/stage-player-buttons.types";

/**
 * My own buttons, L 48, centred over the bottom of my stream: my screen and camera, my mic, and the
 * cog for the settings, which open just above this row. A button that comes or goes never moves the
 * one under the pointer. On a narrow picture it sits beside the fullscreen button, then gets smaller
 * (the picture's layer says so); nothing in it folds.
 */
export function StagePlayerButtons({ extra, beside, size = "l", ...props }: StagePlayerButtonsProps) {
  const anchor = useSettingsAnchor();
  const { ref } = usePinnedRow<HTMLDivElement>(anchor?.row);
  return (
    <div className={styles.row} data-beside={beside || undefined} data-compact={size === "m" || undefined}>
      <div className={styles.buttons} ref={ref}>
        <StageStreamButton kind="screen" size={size} {...props} />
        <StageStreamButton kind="camera" size={size} {...props} />
        {extra && <div className={styles.control}>{extra}</div>}
        <div className={styles.control}>
          <Tooltip text={SETTINGS} hidden={props.settingsOpen}>
            <IconButton
              variant="round"
              size={size}
              ref={anchor?.cog}
              aria-label={SETTINGS}
              aria-expanded={props.settingsOpen}
              aria-haspopup="dialog"
              onClick={props.onSettings}
            >
              <Icon name="cog" />
            </IconButton>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}

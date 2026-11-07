import { Icon } from "@shared/components/icon";
import { IconButton } from "@shared/components/icon-button";
import { Tooltip } from "@shared/components/tooltip";
import { useSettingsAnchor } from "../../hooks/use-settings-anchor.hook";
import { StageStreamButton } from "../stage-stream-button";
import { usePinnedRow } from "./hooks/use-pinned-row.hook";
import styles from "./stage-player-buttons.component.module.css";
import type { StagePlayerButtonsProps } from "./types/stage-player-buttons.types";

/**
 * My own buttons, L 48, centred over the bottom of my stream: my screen and camera, my mic, and the
 * cog for the settings, which open just above this row. A button that comes or goes never moves the
 * one under the pointer.
 */
export function StagePlayerButtons({ extra, ...props }: StagePlayerButtonsProps) {
  const anchor = useSettingsAnchor();
  const { ref } = usePinnedRow<HTMLDivElement>(anchor?.row);
  return (
    <div className={styles.row}>
      <div className={styles.buttons} ref={ref}>
        <StageStreamButton kind="screen" {...props} />
        <StageStreamButton kind="camera" {...props} />
        {extra && <div className={styles.control}>{extra}</div>}
        <div className={styles.control}>
          <Tooltip text="Settings" hidden={props.settingsOpen}>
            <IconButton
              variant="round"
              size="l"
              ref={anchor?.cog}
              aria-label="Settings"
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

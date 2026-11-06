import type { ReactNode } from "react";
import { Icon } from "@shared/components/icon";
import { IconButton } from "@shared/components/icon-button";
import { Tooltip } from "@shared/components/tooltip";
import { SettingsAnchorContext } from "../../hooks/use-settings-anchor.hook";
import { fullRoom } from "../../utils/full-room.util";
import { micState } from "../../utils/mic-state.util";
import { StagePlayerButtons } from "../stage-player-buttons";
import { StageViewerBar } from "../stage-viewer-bar";
import type { StageControlsProps } from "./types/stage-controls.types";
import { hearProps } from "./utils/hear-props.util";

/**
 * The stage's bar of controls. Over someone else's stream, what I hear at the left and me at the
 * right; over my own, my buttons in the middle with my mic; with nobody live, the settings in the
 * corner beside fullscreen, as over a stream. The settings open from what these controls hand over:
 * their cog and their row.
 */
export function StageControls(props: StageControlsProps) {
  const { big, controls, hearing, onStart, onSettings, onMenuChange } = props;
  const micOn = Boolean(controls.voice);
  const toggleMic = () => controls.onVoice?.();
  const mic = micState(micOn);
  let bar: ReactNode;
  if (!big) {
    bar = (
      <StageViewerBar
        live={false}
        settingsOnly
        canShareScreen={controls.canShareScreen}
        onStart={onStart}
        onSettings={onSettings}
      />
    );
  } else if (!big.isMe) {
    bar = (
      <StageViewerBar
        {...hearProps(big, hearing.hearOf, hearing.setHear)}
        live={controls.mine.screen || controls.mine.camera}
        micOn={micOn}
        onMic={toggleMic}
        canShareScreen={controls.canShareScreen}
        {...(controls.free <= 0 ? { full: fullRoom(controls.places) } : {})}
        onStart={onStart}
        onSettings={onSettings}
      />
    );
  } else {
    bar = (
      <StagePlayerButtons
        {...controls}
        onStart={onStart}
        onSettings={onSettings}
        onMenuChange={onMenuChange}
        extra={
          <Tooltip text={mic.label}>
            <IconButton
              variant="round"
              size="l"
              live={micOn}
              aria-pressed={micOn}
              aria-label={mic.label}
              onClick={toggleMic}
            >
              <Icon name={mic.icon} />
            </IconButton>
          </Tooltip>
        }
      />
    );
  }
  return <SettingsAnchorContext value={props.anchor}>{bar}</SettingsAnchorContext>;
}

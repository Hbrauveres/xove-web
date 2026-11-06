import { Icon } from "@shared/components/icon";
import { IconButton } from "@shared/components/icon-button";
import { Tooltip } from "@shared/components/tooltip";
import { micState } from "@features/room/utils/mic-state.util";
import { StagePlayerButtons } from "../stage-player-buttons";
import { fullRoom } from "../../utils/full-room.util";
import { StageViewerBar } from "../stage-viewer-bar";
import type { StageControlsProps } from "./types/stage-controls.types";
import { hearProps } from "./utils/hear-props.util";

/**
 * The stage's bar of controls. Over someone else's stream, what I hear at the left and me at the
 * right; over my own, my buttons in the middle with my mic; with nobody live,
 * the settings in the corner beside fullscreen, as over a stream.
 */
export function StageControls(props: StageControlsProps) {
  const { big, controls, hearing, onStart, onSettings, onMenuChange } = props;
  const micOn = Boolean(controls.voice);
  const toggleMic = () => controls.onVoice?.();

  if (!big) {
    return (
      <StageViewerBar
        live={false}
        settingsOnly
        canShareScreen={controls.canShareScreen}
        onStart={onStart}
        onSettings={onSettings}
      />
    );
  }
  if (!big.isMe) {
    return (
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
  }
  const mic = micState(micOn);
  return (
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

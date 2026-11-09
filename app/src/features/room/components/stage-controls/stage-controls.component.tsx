import type { ReactNode } from "react";
import { SettingsAnchorContext } from "../../hooks/use-settings-anchor.hook";
import { fullRoom } from "../../utils/full-room.util";
import { StageMyMic } from "../stage-my-mic";
import { StagePlayerButtons } from "../stage-player-buttons";
import { StageViewerBar } from "../stage-viewer-bar";
import type { StageControlsProps } from "./types/stage-controls.types";
import { NO_FOLD } from "./constants/stage-controls.constants";
import { hearProps } from "./utils/hear-props.util";

/**
 * The stage's bar of controls. Over someone else's stream, what I hear at the left and me at the
 * right; over my own, my buttons in the middle with my mic; with nobody live, the settings in the
 * corner beside fullscreen, as over a stream. On a narrow picture, what doesn't fit folds into "…"
 * (`fit`), and my own row moves beside fullscreen. The settings open from what these controls hand over:
 * their cog and their row.
 */
export function StageControls(props: StageControlsProps) {
  const { big, controls, hearing, onStart, onSettings, onMenuChange, fit = NO_FOLD } = props;
  const folded = fit.folded;
  const micOn = Boolean(controls.voice);
  const toggleMic = () => controls.onVoice?.();
  let bar: ReactNode;
  if (!big) {
    bar = (
      <StageViewerBar
        live={false}
        settingsOnly
        folded={folded}
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
        held={controls.soundHeld}
        onMic={toggleMic}
        speaking={controls.speaking}
        folded={folded}
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
        beside={fit.beside}
        size={fit.size}
        extra={<StageMyMic on={micOn} speaking={controls.speaking} size={fit.size} onClick={toggleMic} />}
      />
    );
  }
  return <SettingsAnchorContext value={props.anchor}>{bar}</SettingsAnchorContext>;
}

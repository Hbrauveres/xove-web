import { useCallback, useRef } from "react";
import { Toast } from "@shared/components/toast";
import { StageOverlay } from "../../../../components/stage/StageOverlay";
import { SettingsAnchorContext } from "../../hooks/use-settings-anchor.hook";
import { StageControls } from "../stage-controls";
import { StageSounds } from "../stage-sounds";
import { StageView } from "../stage-view";
import { HOLD_MENU } from "./constants/stage-player.constants";
import { useBigQuality } from "./hooks/use-big-quality.hook";
import { useGoToMine } from "./hooks/use-go-to-mine.hook";
import { useStageChrome } from "./hooks/use-stage-chrome.hook";
import { useStageFullscreen } from "./hooks/use-stage-fullscreen.hook";
import { useStageSettings } from "./hooks/use-stage-settings.hook";
import styles from "./stage-player.component.module.css";
import type { StagePlayerProps } from "./types/stage-player.types";
import { bigStreams } from "./utils/big-streams.util";
import { chromeState, lightKey } from "./utils/player-look.util";

/**
 * The player: the stage's whole box, holding the view and every control over it. The controls fade
 * when the mouse rests over a playing video; the settings open over their cog; it goes fullscreen
 * with all of it, the settings and the messages included.
 */
export function StagePlayer(props: StagePlayerProps) {
  const { sharers, controls, stage, hearing, ambilight, shape, video, onVideo, settingsPanel } = props;
  const frame = useRef<HTMLDivElement>(null);
  const bigId = stage.big?.person.id ?? null;
  const { main, small } = bigStreams(stage.big, Boolean(bigId && stage.swappedFor[bigId]));
  const chrome = useStageChrome(frame);
  const fullscreen = useStageFullscreen(frame);
  const settings = useStageSettings({
    frame,
    open: controls.settingsOpen,
    onToggle: controls.onSettings,
    bigId,
    hold: chrome.hold,
  });
  const startMine = useGoToMine(controls.onStart, stage.pick, sharers);
  const onMenuChange = useCallback((open: boolean) => chrome.hold(HOLD_MENU, open), [chrome]);
  useBigQuality(main, Boolean(stage.big?.isMe));

  return (
    <div
      ref={frame}
      className={styles.frame}
      data-chrome={chromeState(stage.playing, chrome.shown)}
      {...chrome.handlers}
    >
      <StageView
        big={stage.big}
        main={main}
        small={small}
        sound={hearing.bigHearing?.sound ?? hearing.stageSound}
        ambilight={ambilight}
        shape={shape}
        lightKey={lightKey(bigId, stage.mainKind, shape)}
        video={video}
        onVideo={onVideo}
        onSwap={() => bigId && stage.toggleSwap(bigId)}
        canShareScreen={controls.canShareScreen}
        onStart={startMine}
      />
      {/* Over a stream and the empty stage alike: stopping the last stream never strands you in fullscreen. */}
      <StageOverlay fullscreen={fullscreen.fullscreen} onFullscreen={fullscreen.toggle} />
      <div className={styles.controls}>
        <SettingsAnchorContext value={settings.anchor}>
          <StageControls
            big={stage.big}
            controls={controls}
            hearing={hearing}
            onStart={startMine}
            onSettings={settings.toggle}
            onMenuChange={onMenuChange}
          />
        </SettingsAnchorContext>
      </div>
      {settingsPanel}
      <StageSounds voices={hearing.voices} previewSounds={hearing.previewSounds} />
      {/* A short message to the user, at the top centre of the player. */}
      <Toast />
    </div>
  );
}

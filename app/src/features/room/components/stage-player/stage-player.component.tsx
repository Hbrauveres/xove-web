import { useRef } from "react";
import { Toast } from "@shared/components/toast";
import { StageStageOverlay } from "../stage-stage-overlay";
import { StageControls } from "../stage-controls";
import { StageSounds } from "../stage-sounds";
import { StageView } from "../stage-view";
import { StageSmallViewButton } from "../stage-small-view-button";
import { useBigQuality } from "./hooks/use-big-quality.hook";
import { useFold } from "./hooks/use-fold.hook";
import { useGoToMine } from "./hooks/use-go-to-mine.hook";
import { usePictureWidth } from "./hooks/use-picture-width.hook";
import { useRowFold } from "./hooks/use-row-fold.hook";
import { useStageChrome } from "./hooks/use-stage-chrome.hook";
import { useStageFullscreen } from "./hooks/use-stage-fullscreen.hook";
import { useStageSettings } from "./hooks/use-stage-settings.hook";
import styles from "./stage-player.component.module.css";
import type { StagePlayerProps } from "./types/stage-player.types";
import { bigStreams } from "./utils/big-streams.util";
import { chromeState, lightKey } from "./utils/player-look.util";
import { rowShape } from "./utils/row-shape.util";
import { smallViewFits } from "./utils/small-view-fits.util";

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
  useBigQuality(main, Boolean(stage.big?.isMe));
  const picture = usePictureWidth();
  const fold = useFold(smallViewFits(picture.width));
  const fit = useRowFold(picture.el, picture.width, rowShape(stage.big, controls));

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
        fold={fold}
        canShareScreen={controls.canShareScreen}
        onStart={startMine}
      />
      {/* The controls sit on the picture, never on the dark around it: a layer with the view's size and place. */}
      <div
        ref={picture.ref}
        className={styles.onPicture}
        data-on-picture
        data-compact={fit.size === "m" || undefined}
      >
        {/* Over a stream and the empty stage alike: stopping the last stream never strands you in fullscreen. */}
        <StageStageOverlay fullscreen={fullscreen.fullscreen} onFullscreen={fullscreen.toggle} />
        <div className={styles.controls}>
          <StageControls
            big={stage.big}
            controls={controls}
            hearing={hearing}
            anchor={settings.anchor}
            onStart={startMine}
            onSettings={settings.toggle}
            onMenuChange={chrome.onMenuChange}
            fit={fit}
          />
          {small && <StageSmallViewButton fold={fold} />}
        </div>
      </div>
      {settingsPanel}
      <StageSounds voices={hearing.voices} previewSounds={hearing.previewSounds} />
      {/* A short message to the user, at the top centre of the player. */}
      <Toast />
    </div>
  );
}

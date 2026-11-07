import { Slider } from "@shared/components/slider";
import { StageSoundButton } from "../stage-sound-button";
import { useViewerSound } from "./hooks/use-viewer-sound.hook";
import styles from "./stage-viewer-sound.component.module.css";
import { viewerSoundWords } from "../../utils/viewer-sound-words.util";
import type { StageViewerSoundProps } from "./types/stage-viewer-sound.types";

/**
 * One sound I hear from the person I watch, over their stream: a click mutes it; resting the mouse on
 * it opens its own slider, unrolling over it. A voice I hear never fades with the controls: its
 * speaking cue stays.
 */
export function StageViewerSound({
  kind,
  sound: s,
  open,
  quiet,
  setOpen,
  anchorRef,
  name,
  talking,
}: StageViewerSoundProps) {
  const sound = useViewerSound(kind, s, open, setOpen);
  const words = viewerSoundWords(kind, s, name);
  const heardVoice = kind === "voice" && !s.unavailable && !s.muted;
  return (
    <span
      ref={anchorRef}
      className={styles.anchor}
      data-stays={heardVoice || undefined}
      onPointerEnter={sound.rest}
      onPointerLeave={sound.leave}
    >
      <StageSoundButton
        kind={kind}
        muted={s.muted}
        volume={s.volume}
        unavailable={s.unavailable}
        talking={talking}
        label={words.label}
        tip={words.tip}
        quiet={quiet}
        onKeyboardFocus={sound.show}
        onToggle={sound.toggle}
      />
      {!s.unavailable && (
        <span className={styles.slider} data-open={open || undefined} data-muted={s.muted || undefined} inert={!open}>
          <Slider
            className={styles.range}
            min={0}
            max={1}
            step={0.05}
            aria-label={words.volume}
            aria-orientation="vertical"
            value={s.volume}
            onChange={(e) => sound.setVolume(Number(e.target.value))}
          />
        </span>
      )}
    </span>
  );
}

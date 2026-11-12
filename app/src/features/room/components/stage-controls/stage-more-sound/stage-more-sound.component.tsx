import { Slider } from "@shared/components/slider";
import { viewerSoundWords } from "../../../utils/viewer-sound-words.util";
import { StageSoundButton } from "../stage-sound-button";
import styles from "./stage-more-sound.component.module.css";
import type { StageMoreSoundProps } from "./types/stage-more-sound.types";

/**
 * A sound folded into "…": its own button (the same icon, crossed while muted; a click mutes or
 * unmutes) and its slider beside it, lying down since the menu is a list of rows. The slider is
 * always there, disabled while the sound is muted or can't be heard (no sound shared, their mic off).
 */
export function StageMoreSound({ kind, sound }: StageMoreSoundProps) {
  if (!sound) return null;
  const words = viewerSoundWords(kind, sound, sound.name);
  return (
    <span className={styles.row}>
      <StageSoundButton
        kind={kind}
        muted={sound.muted}
        volume={sound.volume}
        unavailable={sound.unavailable}
        label={words.label}
        tip={words.tip}
        onToggle={() => sound.onChange({ volume: sound.volume, muted: !sound.muted })}
      />
      <Slider
        className={styles.range}
        min={0}
        max={1}
        step={0.05}
        aria-label={words.volume}
        value={sound.unavailable ? 0 : sound.volume}
        disabled={sound.muted || Boolean(sound.unavailable)}
        onChange={(e) => sound.onChange({ volume: Number(e.target.value), muted: false })}
      />
    </span>
  );
}

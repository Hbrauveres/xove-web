import { Icon } from "@shared/components/icon";
import { Slider } from "@shared/components/slider";
import { soundIcon } from "../../../utils/sound-icon.util";
import styles from "./stage-sound-slider.component.module.css";
import type { StageSoundSliderProps } from "./types/stage-sound-slider.types";

/**
 * One sound's slider in a preview's row: its icon, then its volume. Switching sounds, the old one is
 * laid over and shrinks away to the left while the new one grows from it.
 */
export function StageSoundSlider({ kind, sound, label, phase, onVolume, onDone }: StageSoundSliderProps) {
  const leaving = phase === "leaving";
  return (
    <span
      className={styles.slider}
      data-phase={phase}
      aria-hidden={leaving || undefined}
      onAnimationEnd={(e) => {
        if (e.animationName.includes(leaving ? "shrink" : "grow")) onDone?.();
      }}
    >
      <Icon name={soundIcon(kind, sound.muted)} />
      <Slider
        className={styles.range}
        min={0}
        max={1}
        step={0.05}
        value={sound.volume}
        {...(leaving
          ? { readOnly: true, tabIndex: -1 }
          : { "aria-label": label, onChange: (e) => onVolume?.(Number(e.target.value)) })}
      />
    </span>
  );
}

import { StageSoundSlider } from "../stage-sound-slider";
import styles from "./stage-sound-drawer.component.module.css";
import type { StageSoundDrawerProps } from "./types/stage-sound-drawer.types";

/**
 * A preview's row's slider: one drawer after the buttons that unrolls by its height and rolls back.
 * Switching sounds, the old slider shrinks away to the left while the new one grows from it.
 */
export function StageSoundDrawer({ open, hearing, drawer, label, onVolume }: StageSoundDrawerProps) {
  const { shown, leaving, entering } = drawer;
  return (
    <span className={styles.drawer} data-open={open || undefined} inert={!open}>
      <span className={styles.inner}>
        {leaving && (
          <StageSoundSlider
            key={`out-${leaving}`}
            kind={leaving}
            sound={hearing[leaving]}
            phase="leaving"
            onDone={drawer.left}
          />
        )}
        {shown && (
          <StageSoundSlider
            key={shown}
            kind={shown}
            sound={hearing[shown]}
            label={label}
            phase={entering ? "entering" : undefined}
            onVolume={(v) => onVolume(shown, v)}
            onDone={drawer.entered}
          />
        )}
      </span>
    </span>
  );
}

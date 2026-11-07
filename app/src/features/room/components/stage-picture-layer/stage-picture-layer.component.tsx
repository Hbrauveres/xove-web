import styles from "./stage-picture-layer.component.module.css";
import type { StagePictureLayerProps } from "./types/stage-picture-layer.types";

/**
 * The picture's layer: the view's size and place, so every control over the stream sits on the
 * picture, never on the dark around it, in fullscreen too; it glides with the picture when its shape
 * changes. It holds the fullscreen button and the bar of controls, fading with the player's labels.
 */
export function StagePictureLayer({ setLayer, compact, fullscreen, children }: StagePictureLayerProps) {
  return (
    <div ref={setLayer} className={styles.onPicture} data-on-picture data-compact={compact || undefined}>
      {fullscreen}
      <div className={styles.controls}>{children}</div>
    </div>
  );
}

import { GoLiveWidthContext } from "../../hooks/use-go-live-width.hook";
import styles from "./stage-picture-layer.component.module.css";
import type { StagePictureLayerProps } from "./types/stage-picture-layer.types";

/**
 * The picture's layer: the view's size and place, so every control over the stream sits on the
 * picture, never on the dark around it, in fullscreen too; it glides with the picture when its shape
 * changes. It holds the fullscreen button and the bar of controls, fading with the player's labels;
 * my row in M keeps the fullscreen button level with it.
 */
export function StagePictureLayer({ picture, fullscreen, children }: StagePictureLayerProps) {
  const { setLayer, setGoLive, fit } = picture;
  const compact = fit.size === "m";
  return (
    <div ref={setLayer} className={styles.onPicture} data-on-picture data-compact={compact || undefined}>
      {fullscreen}
      <GoLiveWidthContext value={setGoLive}>
        <div className={styles.controls}>{children}</div>
      </GoLiveWidthContext>
    </div>
  );
}

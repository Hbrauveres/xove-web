import { useMemo, useRef } from "react";
import { WIDESCREEN } from "../../constants/video-shape.constants";
import { gridFor } from "../../utils/light-grid.util";
import { useLightDrawing } from "./hooks/use-light-drawing.hook";
import { useVideoPlaying } from "./hooks/use-video-playing.hook";
import styles from "./stage-light.component.module.css";
import type { StageLightProps } from "./types/stage-light.types";
import { fadeMask } from "./utils/fade-mask.util";
import { glowLayout } from "./utils/glow-layout.util";

/**
 * The picture's own edges glow round the stage. Drawn by the browser's graphics pipeline, with no
 * pixel reads, on a small canvas the page only stretches, so a 4K monitor costs the same as a
 * small one. It updates with the screen's refresh, and stops while the tab is hidden, the video is
 * paused or missing, or it's off; switched off or paused, the light fades out, and back in.
 */
export function StageLight({ video, prefs, shape = WIDESCREEN }: StageLightProps) {
  const { cols, rows } = gridFor(shape);
  const layout = useMemo(() => glowLayout(cols, rows), [cols, rows]);
  // The fade mask's alpha, computed once per grid.
  const mask = useMemo(() => fadeMask(layout), [layout]);
  const canvas = useRef<HTMLCanvasElement>(null);
  const playing = useVideoPlaying(video);
  const lit = prefs.on && playing;
  useLightDrawing(canvas, { video, layout, mask, lit });

  // No stream: no light at all (the empty stage has its own).
  if (!video) return null;
  return (
    <canvas
      ref={canvas}
      className={styles.light}
      width={layout.width}
      height={layout.height}
      style={{ ...layout.placement, opacity: lit ? prefs.brightness : 0 }}
      data-on={lit || undefined}
      aria-hidden="true"
    />
  );
}

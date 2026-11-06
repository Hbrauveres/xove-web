import {
  ALPHA,
  BLUR_CELLS,
  CELL_PX,
  EASE_MS,
  HAS_PICTURE,
  RGBA,
  SLOW_EASE,
  UPDATE_MS,
} from "../constants/stage-light.constants";
import type { EdgeDraw, GlowLayout, LightPaint } from "../types/stage-light.types";
import { easeFor } from "./ease.util";
import { edgeDraws } from "./edge-draws.util";

/** A canvas the size of the light's, and its 2D context, or null without one. */
function sizedCanvas(layout: GlowLayout) {
  const canvas = document.createElement("canvas");
  canvas.width = layout.width;
  canvas.height = layout.height;
  const ctx = canvas.getContext("2d");
  return ctx ? { canvas, ctx } : null;
}

/**
 * What draws the light once onto `out`, with no pixel reads: the picture's edges stretched outward
 * onto a working canvas, over the last update at partial opacity (the easing, or a gentle fixed
 * step with reduced motion), then blurred once onto `out` and cut by the fade mask, made once
 * here. Null where the browser has no canvas.
 */
export function lightPainter(
  out: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  layout: GlowLayout,
  { mask, slow }: { mask: Uint8ClampedArray; slow: boolean },
): LightPaint | null {
  const edge = sizedCanvas(layout);
  const fade = sizedCanvas(layout);
  if (!edge || !fade) return null;
  const img = fade.ctx.createImageData(layout.width, layout.height);
  mask.forEach((alpha, i) => (img.data[i * RGBA + ALPHA] = alpha));
  fade.ctx.putImageData(img, 0, 0);

  let primed = false;
  let last = 0;
  // The nine draws, kept until the picture's size changes.
  let draws: EdgeDraw[] = [];
  let drawsFor = "";
  return (now) => {
    if (video.paused || video.readyState < HAS_PICTURE || !video.videoWidth) return;
    edge.ctx.globalAlpha = !primed ? 1 : slow ? SLOW_EASE : easeFor(last ? now - last : UPDATE_MS, EASE_MS);
    primed = true;
    last = now;
    const size = `${video.videoWidth}x${video.videoHeight}`;
    if (size !== drawsFor) {
      draws = edgeDraws(layout, video.videoWidth, video.videoHeight);
      drawsFor = size;
    }
    for (const { src, dst } of draws) edge.ctx.drawImage(video, ...src, ...dst);
    out.globalCompositeOperation = "copy";
    out.filter = `blur(${CELL_PX * BLUR_CELLS}px)`;
    out.drawImage(edge.canvas, 0, 0);
    out.filter = "none";
    out.globalCompositeOperation = "destination-in";
    out.drawImage(fade.canvas, 0, 0);
    out.globalCompositeOperation = "source-over";
  };
}

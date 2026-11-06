import { MS_PER_SECOND } from "@shared/constants/time.constants";
import { FLICKER_FPS } from "../constants/static-bands.constants";

/**
 * Draws a static's frame at most 20 times a second (every fourth frame of a 60 Hz screen),
 * skipping while the tab is hidden; or once, still, for reduced motion. Each draw gets the time in
 * ms. Returns what stops it.
 */
export function startFlicker(draw: (t: number) => void, still: boolean): () => void {
  if (still) {
    draw(0);
    return () => undefined;
  }
  let frame = 0;
  let last = 0;
  const tick = (t: number) => {
    frame = requestAnimationFrame(tick);
    if (document.hidden || t - last < MS_PER_SECOND / FLICKER_FPS) return;
    last = t;
    draw(t);
  };
  frame = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(frame);
}

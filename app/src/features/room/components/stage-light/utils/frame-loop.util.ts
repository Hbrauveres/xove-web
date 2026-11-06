import { ON_TIME_MS, SLOW_SAMPLE_MS, UPDATE_MS } from "../constants/stage-light.constants";
import type { LightPaint } from "../types/stage-light.types";

/**
 * Paints about 60 times a second, on the screen's frames, while the tab can be seen; twice a
 * second with reduced motion; nothing while the tab is hidden. Returns what stops it.
 */
export function startFrameLoop(paint: LightPaint, slow: boolean): () => void {
  let raf: number | undefined;
  let timer: number | undefined;
  let due = 0;
  const stop = () => {
    if (raf !== undefined) cancelAnimationFrame(raf);
    window.clearInterval(timer);
    raf = timer = undefined;
  };
  const frame = (now: number) => {
    if (now >= due - ON_TIME_MS) {
      paint(now);
      // Keep the cadence; after a long gap (a hidden tab), start again from now.
      due = due + UPDATE_MS < now - UPDATE_MS ? now + UPDATE_MS : due + UPDATE_MS;
    }
    raf = requestAnimationFrame(frame);
  };
  const run = () => {
    stop();
    if (document.hidden) return;
    due = 0;
    if (slow) {
      paint(performance.now());
      timer = window.setInterval(() => paint(performance.now()), SLOW_SAMPLE_MS);
    } else {
      raf = requestAnimationFrame(frame);
    }
  };
  run();
  document.addEventListener("visibilitychange", run);
  return () => {
    stop();
    document.removeEventListener("visibilitychange", run);
  };
}

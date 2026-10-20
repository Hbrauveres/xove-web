import { useEffect, useRef } from "react";
import { bandLight } from "./staticBands";
import styles from "./StaticNoise.module.css";

/** One grain of static is this many CSS pixels on a desktop's stage: fine, and easy on the eye. A
 * smaller stage has a finer grain, down to half, so a phone's static isn't a zoomed-in desktop's. */
const GRAIN = 1.5;
const grainFor = (width: number) => Math.min(GRAIN, Math.max(GRAIN / 2, width / 1000));
/** Static flickers at this rate; more is wasted on a faded background. */
const FPS = 20;
/** How much the glass bulges: the bands bow this much at the screen's sides (0 is flat). */
const BULGE = 0.09;

/**
 * A TV's static behind the empty stage (spec 0136): snow in horizontal bands rolling slowly down,
 * dark and faded so it never competes with the way to start, behind a gently curved glass, as a
 * 90s TV's. Still for reduced motion.
 */
export function StaticNoise() {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d", { alpha: false });
    if (!el || !ctx) return;
    const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    let grain = GRAIN;
    let w = 0;
    let h = 0;
    let image: ImageData | null = null;
    let words: Uint32Array | null = null;
    // For each column, how far it bows the rows (the glass's curve), as a share of the row's
    // distance from the middle.
    let bow = new Float32Array(1);
    // Each row's brightness (0–1), for this moment.
    let gain = new Float32Array(1);
    const fit = () => {
      const r = el.getBoundingClientRect();
      grain = grainFor(r.width);
      w = Math.max(1, Math.ceil(r.width / grain));
      h = Math.max(1, Math.ceil(r.height / grain));
      el.width = w;
      el.height = h;
      image = ctx.createImageData(w, h);
      words = new Uint32Array(image.data.buffer);
      bow = new Float32Array(w);
      gain = new Float32Array(h);
      for (let x = 0; x < w; x++) bow[x] = BULGE * ((x / w - 0.5) * 2) ** 2;
    };
    fit();
    const resized = new ResizeObserver(fit);
    resized.observe(el);

    let seed = 0x9e3779b9;
    const draw = (t: number) => {
      if (!image || !words) return;
      const s = t / 1000;
      // As a share of the stage's height, so the bands keep their place whatever the grain or size.
      for (let y = 0; y < h; y++) gain[y] = bandLight(y / h, s);
      const mid = h / 2;
      for (let y = 0; y < h; y++) {
        const row = y * w;
        const fromMid = y - mid;
        for (let x = 0; x < w; x++) {
          // xorshift: fast enough for every grain, every frame.
          seed ^= seed << 13;
          seed ^= seed >>> 17;
          seed ^= seed << 5;
          // Behind curved glass the rows bow towards the middle at the sides.
          const yy = (y - fromMid * bow[x]) | 0;
          const c = ((seed >>> 24) * gain[yy]) | 0;
          words[row + x] = 0xff000000 | (c << 16) | (c << 8) | c;
        }
      }
      ctx.putImageData(image, 0, 0);
    };

    let frame = 0;
    let last = 0;
    const tick = (t: number) => {
      frame = requestAnimationFrame(tick);
      if (document.hidden || t - last < 1000 / FPS) return;
      last = t;
      draw(t);
    };
    if (still) draw(0);
    else frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      resized.disconnect();
    };
  }, []);
  return (
    <span className={styles.static} aria-hidden="true">
      <canvas ref={canvas} className={styles.canvas} />
      <span className={styles.glass} />
    </span>
  );
}

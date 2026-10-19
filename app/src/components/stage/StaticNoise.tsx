import { useEffect, useRef } from "react";
import styles from "./StaticNoise.module.css";

/** One grain of static is this many CSS pixels: a coarse, old-TV grain, and little to draw. */
const GRAIN = 3;
/** Static flickers at this rate; more is wasted on a faded background. */
const FPS = 20;

/**
 * A TV's static behind the empty stage (spec 0136): snow in horizontal bands that roll and breathe,
 * dark and faded so it never competes with the way to start. Near a mouse the static stirs:
 * brighter, its rows torn sideways, settling once the mouse rests. Still for reduced motion.
 */
export function StaticNoise() {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d", { alpha: false });
    if (!el || !ctx) return;
    const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    // The pointer, in grains, and how stirred the static is (1 just moved, fading to 0).
    const pointer = { x: -1e4, y: -1e4, stir: 0 };
    let w = 0;
    let h = 0;
    let image: ImageData | null = null;
    let words: Uint32Array | null = null;
    const fit = () => {
      const r = el.getBoundingClientRect();
      w = Math.max(1, Math.ceil(r.width / GRAIN));
      h = Math.max(1, Math.ceil(r.height / GRAIN));
      el.width = w;
      el.height = h;
      image = ctx.createImageData(w, h);
      words = new Uint32Array(image.data.buffer);
    };
    fit();
    const resized = new ResizeObserver(fit);
    resized.observe(el);
    const moved = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = el.getBoundingClientRect();
      pointer.x = (e.clientX - r.left) / GRAIN;
      pointer.y = (e.clientY - r.top) / GRAIN;
      pointer.stir = 1;
    };
    window.addEventListener("pointermove", moved);

    // Each row's brightness (0–1) and sideways tear, for this moment.
    const gain = new Float32Array(4096);
    const tear = new Int16Array(4096);
    let seed = 0x9e3779b9;
    const draw = (t: number) => {
      if (!image || !words) return;
      const s = t / 1000;
      const reach = Math.max(18, h * 0.28);
      for (let y = 0; y < h; y++) {
        // Bands of different widths rolling down: bright ones with clear edges, dark gaps between.
        const a = Math.sin(y * 0.09 - s * 1.1) * 0.5 + 0.5;
        const b = Math.sin(y * 0.027 + s * 0.4) * 0.5 + 0.5;
        const m = a * 0.55 + b * 0.45;
        const edge = Math.min(1, Math.max(0, (m - 0.42) / 0.16));
        const g = 0.12 + 0.88 * edge * edge * (3 - 2 * edge);
        gain[y] = g;
        // The mouse tears the rows near its own sideways, settling as it rests.
        const near = Math.max(0, 1 - Math.abs(y - pointer.y) / reach) * pointer.stir;
        tear[y] = Math.round(near * near * 10 * Math.sin(y * 0.9 + s * 30));
      }
      const glow = Math.max(24, Math.min(w, h) * 0.35);
      for (let y = 0; y < h; y++) {
        const row = y * w;
        const shift = tear[y];
        const dyP = y - pointer.y;
        for (let x = 0; x < w; x++) {
          // xorshift: fast enough for every grain, every frame.
          seed ^= seed << 13;
          seed ^= seed >>> 17;
          seed ^= seed << 5;
          let v = (seed >>> 24) * gain[y];
          // Round the mouse, the static gathers: brighter, fading with distance.
          if (pointer.stir > 0.02) {
            const dx = x - pointer.x;
            const d = Math.sqrt(dx * dx + dyP * dyP) / glow;
            if (d < 1) v *= 1 + (1 - d) * (1 - d) * 1.4 * pointer.stir;
          }
          const c = v > 255 ? 255 : v | 0;
          words[row + ((x + shift + w) % w)] = 0xff000000 | (c << 16) | (c << 8) | c;
        }
      }
      ctx.putImageData(image, 0, 0);
      pointer.stir *= 0.93;
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
      window.removeEventListener("pointermove", moved);
    };
  }, []);
  return (
    <span className={styles.static} aria-hidden="true">
      <canvas ref={canvas} className={styles.canvas} />
    </span>
  );
}

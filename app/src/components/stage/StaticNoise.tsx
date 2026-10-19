import { useEffect, useRef } from "react";
import styles from "./StaticNoise.module.css";

export type StaticKind = "waves" | "bands";

/** One grain of static is this many CSS pixels: a fine grain, still little to draw. */
const GRAIN = 2;
/** Static flickers at this rate: slow enough to be easy on the eye, and little work. */
const FPS = 12;

/**
 * A TV's static behind the empty stage (spec 0136, draft): dark and faded so it never competes with
 * the way to start. `waves` is snow with a tall interference band of chevron rows, bent by a wide
 * wave, drifting slowly down;
 * `bands` is snow in soft horizontal bands that roll slowly. Near a mouse the static stirs: brighter,
 * its rows torn sideways, settling once the mouse rests. Still for reduced motion.
 */
export function StaticNoise({ kind }: { kind: StaticKind }) {
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
        let g: number;
        if (kind === "bands") {
          // Soft bands of different widths rolling slowly down, never far from the snow round them.
          const a = Math.sin((y / h) * 38 - s * 0.5) * 0.5 + 0.5;
          const b = Math.sin((y / h) * 13 + s * 0.2) * 0.5 + 0.5;
          g = 0.28 + 0.72 * Math.pow(a * 0.6 + b * 0.4, 1.4);
        } else {
          g = 0.8;
        }
        gain[y] = g;
        // The mouse tears the rows near its own sideways, settling as it rests.
        const near = Math.max(0, 1 - Math.abs(y - pointer.y) / reach) * pointer.stir;
        tear[y] = Math.round(near * near * 10 * Math.sin(y * 0.9 + s * 30));
      }
      // The interference for `waves`: rows of chevrons in a tall band that drifts slowly down, bent
      // by a wide, slow wave across the picture.
      const band = ((s * 0.025 + 0.5) % 1.6) * h - h * 0.3;
      const bandH = Math.max(24, h * 0.32);
      const bend = h * 0.09;
      const rowH = Math.max(10, h * 0.07);
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
          if (kind === "waves") {
            const yw = y + Math.sin((x / w) * 6 + s * 0.35) * bend;
            const dy = yw - band;
            if (Math.abs(dy) < bandH) {
              const e = Math.cos((dy / bandH) * Math.PI) * 0.5 + 0.5;
              const local = (((yw % rowH) + rowH) % rowH) / rowH - 0.5;
              const chevron = Math.sin((x / w) * 70 + Math.abs(local) * 7 - s * 1.2) * 0.5 + 0.5;
              v *= 1 - e * 0.9 * (1 - chevron) + e * 0.45 * chevron;
            }
          }
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
  }, [kind]);
  return (
    <span className={styles.static} aria-hidden="true">
      <canvas ref={canvas} className={styles.canvas} />
    </span>
  );
}

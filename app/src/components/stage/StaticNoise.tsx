import { useEffect, useRef } from "react";
import styles from "./StaticNoise.module.css";

/** One grain of static is this many CSS pixels: fine, and easy on the eye. */
const GRAIN = 1.5;
/** Static flickers at this rate; more is wasted on a faded background. */
const FPS = 20;
/** How fast the bands roll down, in CSS pixels a second. */
const ROLL = 24;

/**
 * A TV's static behind the empty stage (spec 0136): snow in horizontal bands rolling slowly down,
 * dark and faded so it never competes with the way to start. A moving mouse disturbs it, settling
 * once the mouse rests. Still for reduced motion.
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
    const grain = GRAIN;
    // Draft only (spec 0136): the harness's bar tunes how dark the gaps are and what the mouse does.
    const draft = () => ({
      floor: Number.parseFloat(getComputedStyle(el).getPropertyValue("--static-floor")) || 0.5,
      mouse: document.documentElement.dataset.staticMouse ?? "tear",
    });
    let w = 0;
    let h = 0;
    let image: ImageData | null = null;
    let words: Uint32Array | null = null;
    const fit = () => {
      const r = el.getBoundingClientRect();
      w = Math.max(1, Math.ceil(r.width / grain));
      h = Math.max(1, Math.ceil(r.height / grain));
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
      pointer.x = (e.clientX - r.left) / grain;
      pointer.y = (e.clientY - r.top) / grain;
      pointer.stir = 1;
    };
    window.addEventListener("pointermove", moved);

    // Each row's brightness (0–1) and sideways tear, for this moment.
    const gain = new Float32Array(4096);
    const tear = new Int16Array(4096);
    let seed = 0x9e3779b9;
    // How far the mouse has pushed the bands down ("roll"), in CSS pixels.
    let kick = 0;
    const draw = (t: number) => {
      if (!image || !words) return;
      const { floor, mouse } = draft();
      const s = t / 1000;
      const reach = Math.max(24, h * 0.2);
      if (mouse === "roll") kick += pointer.stir * 9;
      for (let y = 0; y < h; y++) {
        // In CSS pixels, so the bands keep their size whatever the grain.
        const py = y * grain;
        // The bands roll down together, keeping their sizes; on top, the picture wavers up and down
        // a little, as a TV losing its vertical hold, and each band's brightness shimmers. The gaps
        // between them are dimmer snow, never black.
        const roll = py - s * ROLL - kick + Math.sin(s * 0.9) * 14 + Math.sin(s * 2.7) * 4;
        const a = Math.sin(roll * 0.03) * 0.5 + 0.5;
        const b = Math.sin(roll * 0.009 + Math.sin(s * 0.3) * 0.35) * 0.5 + 0.5;
        const shimmer = 0.82 + 0.18 * Math.sin(s * 1.9 + roll * 0.004);
        const m = a * 0.55 + b * 0.45;
        const edge = Math.min(1, Math.max(0, (m - 0.42) / 0.16));
        gain[y] = (floor + (1 - floor) * edge * edge * (3 - 2 * edge)) * shimmer;
        // "tear": the rows near the mouse slip sideways, settling as it rests.
        const near = mouse === "tear" ? Math.max(0, 1 - Math.abs(y - pointer.y) / reach) * pointer.stir : 0;
        tear[y] = Math.round(near * near * 16 * Math.sin(y * 0.7 + s * 30));
      }
      for (let y = 0; y < h; y++) {
        const row = y * w;
        const shift = tear[y];
        for (let x = 0; x < w; x++) {
          // xorshift: fast enough for every grain, every frame.
          seed ^= seed << 13;
          seed ^= seed >>> 17;
          seed ^= seed << 5;
          const c = ((seed >>> 24) * gain[y]) | 0;
          words[row + ((x + shift + w) % w)] = 0xff000000 | (c << 16) | (c << 8) | c;
        }
      }
      ctx.putImageData(image, 0, 0);
      pointer.stir *= 0.9;
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

import { useEffect, useRef } from "react";
import type { AmbilightPrefs } from "../../media/preferences";
import styles from "./CornerGlow.module.css";

/** The light's strength at `s` of its reach: the ambilight's own falloff (spec 0118). */
const falloff = (s: number) => (s >= 1 ? 0 : Math.exp(-3.4 * s) * (1 - s * s * s));
/** Canvas pixels per page pixel: the light is soft, so half resolution looks the same. */
const SCALE = 0.5;
/** The top right red as in the logo; the others a slightly blue grey, whose three colours step
    at different shades, so the dark end of the fade shows no bands. */
const COLOURS: Record<string, [number, number, number, number]> = {
  tl: [138, 150, 172, 0.32],
  tr: [239, 75, 75, 0.6],
  bl: [138, 150, 172, 0.32],
  br: [138, 150, 172, 0.32],
};

type Segment = [number, number, number, number];

/** The distance from (x, y) to a segment. */
function toSegment(x: number, y: number, [ax, ay, bx, by]: Segment) {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(x - (ax + t * dx), y - (ay + t * dy));
}

/**
 * Nobody live (spec 0123 prototype): each viewfinder corner mark glows outward, in its own
 * colour, from the mark itself: the light at any point follows its distance to the nearest point
 * of the mark's two arms, so it's even all along them and wraps evenly round the bend. Drawn once
 * per size on a canvas behind the stage (the stage hides the inside), so it costs nothing while
 * shown; it follows the ambilight's switch and brightness.
 */
export function CornerGlow({ prefs }: { prefs: AmbilightPrefs }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const el = canvas.current;
    const box = el?.parentElement;
    if (!el || !box) return;
    let frame = 0;
    const draw = () => {
      const reach = Math.min(340, Math.max(180, 0.24 * Math.min(window.innerWidth, window.innerHeight)));
      el.style.setProperty("--reach", `${reach}px`);
      const b = box.getBoundingClientRect();
      const w = Math.ceil((b.width + reach * 2) * SCALE);
      const h = Math.ceil((b.height + reach * 2) * SCALE);
      el.width = w;
      el.height = h;
      const ctx = el.getContext("2d");
      if (!ctx || !w || !h) return;
      // Each mark's two arms, along its drawn edges, in canvas pixels.
      const marks = [...box.querySelectorAll<HTMLElement>("[data-mark]")].map((m) => {
        const r = m.getBoundingClientRect();
        const at = m.dataset.mark ?? "tl";
        const x0 = (r.left - b.left + reach) * SCALE, x1 = (r.right - b.left + reach) * SCALE;
        const y0 = (r.top - b.top + reach) * SCALE, y1 = (r.bottom - b.top + reach) * SCALE;
        const cx = at.endsWith("l") ? x0 : x1;
        const cy = at.startsWith("t") ? y0 : y1;
        const arms: Segment[] = [
          [x0, cy, x1, cy],
          [cx, y0, cx, y1],
        ];
        return { arms, colour: COLOURS[at] ?? COLOURS.tl };
      });
      const img = ctx.createImageData(w, h);
      const r = reach * SCALE;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          let a = 0, red = 0, green = 0, blue = 0;
          for (const { arms, colour } of marks) {
            const d = Math.min(toSegment(x, y, arms[0]), toSegment(x, y, arms[1]));
            if (d >= r) continue;
            const light = falloff(d / r) * colour[3];
            a += light;
            red += colour[0] * light;
            green += colour[1] * light;
            blue += colour[2] * light;
          }
          if (a <= 0) continue;
          const i = (y * w + x) * 4;
          img.data[i] = red / a;
          img.data[i + 1] = green / a;
          img.data[i + 2] = blue / a;
          img.data[i + 3] = Math.min(1, a) * 255;
        }
      }
      ctx.putImageData(img, 0, 0);
    };
    const later = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(draw);
    };
    later();
    const watch = new ResizeObserver(later);
    watch.observe(box);
    window.addEventListener("resize", later);
    return () => {
      cancelAnimationFrame(frame);
      watch.disconnect();
      window.removeEventListener("resize", later);
    };
  }, []);
  return (
    <canvas
      ref={canvas}
      className={styles.glow}
      style={{ opacity: prefs.on ? prefs.brightness : 0 }}
      aria-hidden="true"
    />
  );
}

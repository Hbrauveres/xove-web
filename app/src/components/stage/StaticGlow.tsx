import { useEffect, useRef } from "react";
import type { AmbilightPrefs } from "../../media/preferences";
import { bandLight } from "./staticBands";
import styles from "./StaticGlow.module.css";

/** The light is drawn this coarse (CSS pixels a cell) and then blurred: it only has to be soft. */
const CELL = 24;
/** As often as the static flickers. */
const FPS = 20;

/**
 * The empty stage's ambilight (spec 0136): the static's bands light the wall round the stage as they
 * roll, the way a TV's picture does. Each row of a small canvas is as bright as the bands at that
 * height; the browser stretches and blurs it behind the stage, which hides the middle, so only the
 * light past its edges shows. It follows the ambilight's switch and brightness.
 */
export function StaticGlow({ prefs }: { prefs: AmbilightPrefs }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx || !prefs.on) return;
    const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    // The canvas covers the stage only; CSS stretches it past the edges.
    let rows = 1;
    const fit = () => {
      const r = el.parentElement!.getBoundingClientRect();
      rows = Math.max(1, Math.ceil(r.height / CELL));
      el.width = 1;
      el.height = rows;
    };
    fit();
    const resized = new ResizeObserver(fit);
    resized.observe(el.parentElement!);
    const draw = (t: number) => {
      const s = t / 1000;
      for (let y = 0; y < rows; y++) {
        const v = Math.round(bandLight((y + 0.5) * CELL, s) * 255);
        // The corner glow's slightly blue grey, so the light and the corners match.
        ctx.fillStyle = `rgb(${(v * 0.54) | 0}, ${(v * 0.59) | 0}, ${(v * 0.67) | 0})`;
        ctx.fillRect(0, y, 1, 1);
      }
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
  }, [prefs.on]);
  return (
    <span className={styles.glow} style={{ opacity: prefs.on ? prefs.brightness : 0 }} aria-hidden="true">
      <canvas ref={canvas} className={styles.canvas} />
    </span>
  );
}

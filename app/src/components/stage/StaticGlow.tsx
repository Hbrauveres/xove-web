import { useEffect, useRef, useState } from "react";
import type { AmbilightPrefs } from "@services/preferences-service/types/preferences.types";
import { bandLight, onScreen, tv } from "./staticBands";
import styles from "./StaticGlow.module.css";

/** The light is drawn this coarse (CSS pixels a cell) and then blurred: it only has to be soft. */
const CELL = 24;
/** As often as the static flickers. */
const FPS = 20;

/**
 * The empty stage's ambilight (spec 0136): the static's bands light the wall round the stage as they
 * roll, the way a TV's picture does, never brighter than the static itself. Each row of a small
 * canvas is as bright as the static at that height; the browser stretches and blurs it behind the
 * stage, which hides the middle, so only the light past its edges shows. It follows the
 * ambilight's switch and brightness.
 */
export function StaticGlow({ prefs }: { prefs: AmbilightPrefs }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  // The turn-on's light on the wall, only with the stage's own turn-on: the first time it stands by.
  const [turningOn, setTurningOn] = useState(
    () => !tv.on && !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx || !prefs.on) return;
    const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    // The canvas covers the stage only; CSS stretches it past the edges.
    let rows = 1;
    // Sizing a canvas clears it: still, it's drawn again at once; moving, the next frame does.
    let redraw = () => {};
    const fit = () => {
      const r = el.parentElement!.getBoundingClientRect();
      rows = Math.max(1, Math.ceil(r.height / CELL));
      el.width = 1;
      el.height = rows;
      redraw();
    };
    fit();
    const resized = new ResizeObserver(fit);
    resized.observe(el.parentElement!);
    const draw = (t: number) => {
      const s = t / 1000;
      for (let y = 0; y < rows; y++) {
        // As bright as the static looks on the screen at that height, never brighter: the light
        // comes from it. A touch of blue, as the corner glow's grey.
        const v = onScreen(bandLight((y + 0.5) / rows, s)) * 255;
        ctx.fillStyle = `rgb(${(v * 0.94) | 0}, ${(v * 0.97) | 0}, ${v | 0})`;
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
    if (still) {
      redraw = () => draw(0);
      draw(0);
    } else frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      resized.disconnect();
    };
  }, [prefs.on]);
  return (
    <span className={styles.glow} style={{ opacity: prefs.on ? prefs.brightness : 0 }} aria-hidden="true">
      <canvas ref={canvas} className={styles.canvas} />
      {/* The TV turning on lights the wall too, once, in time with the stage's flash. */}
      {turningOn && <i className={styles.flash} onAnimationEnd={() => setTurningOn(false)} />}
    </span>
  );
}

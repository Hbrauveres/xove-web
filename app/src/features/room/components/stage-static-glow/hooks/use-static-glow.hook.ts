import { useEffect, useRef } from "react";
import { reducedMotion } from "@shared/utils/reduced-motion.util";
import { startFlicker } from "../../../utils/flicker.util";
import { CELL } from "../constants/static-glow.constants";
import type { StaticGlowRefs } from "../types/stage-static-glow.types";
import { glowRowColour } from "../utils/glow-row.util";

/**
 * Keeps the static's light drawn while it's on, on the canvas and in the box the returned refs are
 * given: one pixel wide, a row per 24 px of the stage, each row as bright as the static at that
 * height; the page stretches and blurs it.
 */
export function useStaticGlow(on: boolean): StaticGlowRefs {
  const canvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = canvas.current;
    const box = stage.current;
    const ctx = el?.getContext("2d");
    if (!el || !box || !ctx || !on) return;
    const still = reducedMotion();
    let rows = 1;
    // Sizing clears the canvas: once it's started, a still light is drawn again at once.
    let started = false;
    const draw = (t: number) => {
      for (let y = 0; y < rows; y++) {
        ctx.fillStyle = glowRowColour(y, rows, t);
        ctx.fillRect(0, y, 1, 1);
      }
    };
    const fit = () => {
      rows = Math.max(1, Math.ceil(box.getBoundingClientRect().height / CELL));
      el.width = 1;
      el.height = rows;
      if (still && started) draw(0);
    };
    fit();
    const resized = new ResizeObserver(fit);
    resized.observe(box);
    const stop = startFlicker(draw, still);
    started = true;
    return () => {
      stop();
      resized.disconnect();
    };
  }, [on]);
  return { canvas, stage };
}

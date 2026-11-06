import { useEffect, useRef, type RefObject } from "react";
import { reducedMotion } from "@shared/utils/reduced-motion.util";
import { startFlicker } from "../../../utils/flicker.util";
import { grainFor } from "../utils/grain-size.util";
import { staticPicture } from "../utils/static-picture.util";

/**
 * Keeps the static drawn on the canvas the returned ref is given: sized in grains to the canvas's
 * box, flickering, or still for reduced motion. Sizing a canvas clears it: still, it's drawn again
 * at once; moving, the next frame does.
 */
export function useStaticNoise(): RefObject<HTMLCanvasElement | null> {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d", { alpha: false });
    if (!el || !ctx) return;
    const still = reducedMotion();
    const picture = staticPicture(ctx);
    // Sizing clears the canvas: once it's started, a still static is drawn again at once.
    let started = false;
    const fit = () => {
      const r = el.getBoundingClientRect();
      const grain = grainFor(r.width);
      el.width = Math.max(1, Math.ceil(r.width / grain));
      el.height = Math.max(1, Math.ceil(r.height / grain));
      picture.fit(el.width, el.height);
      if (still && started) picture.draw(0);
    };
    fit();
    const resized = new ResizeObserver(fit);
    resized.observe(el);
    const stop = startFlicker(picture.draw, still);
    started = true;
    return () => {
      stop();
      resized.disconnect();
    };
  }, []);
  return canvas;
}

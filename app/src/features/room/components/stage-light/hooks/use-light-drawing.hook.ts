import { useEffect, type RefObject } from "react";
import { reducedMotion } from "@shared/utils/reduced-motion.util";
import type { LightDrawing } from "../types/stage-light.types";
import { startFrameLoop } from "../utils/frame-loop.util";
import { lightPainter } from "../utils/light-painter.util";

/** Draws the light on its canvas while it's lit and has a video, and stops when either goes. */
export function useLightDrawing(
  canvas: RefObject<HTMLCanvasElement | null>,
  { video, layout, mask, lit }: LightDrawing,
) {
  useEffect(() => {
    const out = canvas.current?.getContext("2d");
    if (!lit || !video || !out) return;
    const slow = reducedMotion();
    const paint = lightPainter(out, video, layout, { mask, slow });
    return paint ? startFrameLoop(paint, slow) : undefined;
  }, [canvas, lit, video, layout, mask]);
}

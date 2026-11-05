import { useCallback, useEffect, useRef, type RefObject } from "react";
import type { Frame, WordMark } from "../types/mark.types";
import { applyFrame } from "../utils/apply-frame.util";
import { frameTransforms } from "../utils/frame-transforms.util";
import { TOTAL_MS, frameAt } from "../utils/mark-timeline.util";
import { reducedMotion } from "../utils/reduced-motion.util";

/**
 * Plays the wordmark's animation on its SVG, frame by frame, without re-rendering. Once per hover:
 * a call while it plays is ignored. Nothing plays with reduced motion.
 */
export function useMarkAnimation(svg: RefObject<SVGSVGElement | null>, mark: WordMark | null) {
  const raf = useRef<number | undefined>(undefined);
  const playing = useRef(false);
  useEffect(() => () => cancelAnimationFrame(raf.current ?? 0), []);

  const apply = useCallback(
    (f: Frame) => {
      if (svg.current && mark) applyFrame(svg.current, frameTransforms(mark, f));
    },
    [svg, mark],
  );

  return useCallback(() => {
    if (!mark || playing.current || reducedMotion()) return;
    playing.current = true;
    let start: number | undefined;
    const step = (now: number) => {
      start ??= now;
      const t = now - start;
      apply(frameAt(t));
      if (t < TOTAL_MS) raf.current = requestAnimationFrame(step);
      else playing.current = false;
    };
    raf.current = requestAnimationFrame(step);
  }, [apply, mark]);
}

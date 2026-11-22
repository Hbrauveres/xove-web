import { useCallback, useEffect, useRef } from "react";
import type { PointerEvent, RefObject } from "react";
import { reducedMotion } from "@shared/utils/reduced-motion.util";
import { pointerShift } from "../utils/pointer-shift.util";

/**
 * Shifts the scene a few px away from the pointer as it moves over the stage, and back when it
 * leaves. Only on pointer moves, at most once a frame, as a transform; never with reduced motion.
 */
export function usePointerShift(scene: RefObject<HTMLElement | null>) {
  const frame = useRef(0);
  const move = useCallback(
    (x: number, y: number) => {
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        if (scene.current) scene.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      });
    },
    [scene],
  );
  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (reducedMotion()) return;
      const to = pointerShift(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect());
      move(to.x, to.y);
    },
    [move],
  );
  const onPointerLeave = useCallback(() => move(0, 0), [move]);
  return { onPointerMove, onPointerLeave };
}

import { useCallback, type RefObject } from "react";
import { useFullscreenElement } from "../../../hooks/use-fullscreen-element.hook";
import type { StageFullscreen } from "../types/stage-fullscreen.types";

/**
 * Whether the player is fullscreen, and one way in and out of it; Escape (the browser's own way
 * out) is followed too. Where the browser won't allow it, the stage stays inline.
 */
export function useStageFullscreen(frame: RefObject<HTMLElement | null>): StageFullscreen {
  const element = useFullscreenElement();
  const fullscreen = element !== null && element === frame.current;
  const toggle = useCallback(() => {
    const el = frame.current;
    if (document.fullscreenElement && document.fullscreenElement === el) {
      void document.exitFullscreen?.().catch(() => undefined);
      return;
    }
    el?.requestFullscreen?.().catch(() => undefined);
  }, [frame]);
  return { fullscreen, toggle };
}

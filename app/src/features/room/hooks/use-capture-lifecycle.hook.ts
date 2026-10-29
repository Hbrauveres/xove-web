import { useEffect, type RefObject } from "react";
import type { Capture } from "@services/livekit-service/types/livekit.types";

/**
 * Lets a capture that isn't sent go: when the browser ends it (unplugged, or its own control), and
 * when the page closes with it still on.
 */
export function useCaptureLifecycle(
  capture: Capture | null,
  current: RefObject<Capture | null>,
  discard: (capture: Capture) => void,
  clear: () => void,
): void {
  useEffect(() => {
    if (!capture) return;
    return capture.onEnded(() => {
      discard(capture);
      clear();
    });
  }, [capture, discard, clear]);

  useEffect(
    () => () => {
      if (current.current) discard(current.current);
    },
    [current, discard],
  );
}

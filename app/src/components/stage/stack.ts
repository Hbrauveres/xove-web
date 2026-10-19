import { useEffect, useRef, useState } from "react";
import type { Sharer } from "../../types";

/** A finger holds this long to show a preview's buttons, as the stage's own (spec 0131). */
export const HOLD_MS = 500;
/** How long a swap plays: the picture behind coming forward. */
const SWAP_MS = 400;

/**
 * A preview's pictures (spec 0131): the one in front (their screen, or their camera when swapped or
 * when that's all they share) and, for a screen and a camera together, the other one behind.
 */
export function stackOf(s: Sharer, swapped: boolean) {
  const both = Boolean(s.screen && s.camera);
  const feed = (both && swapped ? s.camera : s.screen) ?? s.camera;
  const back = both ? (feed === s.screen ? s.camera : s.screen) : undefined;
  // My own streams play from my browser; someone else's from LiveKit, once they arrive.
  const video = feed && (s.isMe ? feed.local : feed.remote?.video);
  const backVideo = back && (s.isMe ? back.local : back.remote?.video);
  return { both, feed, video, back, backVideo };
}

/** Whose swap is playing, and starting one. */
export function useSwapping() {
  const [swapping, setSwapping] = useState<string | null>(null);
  useEffect(() => {
    if (!swapping) return;
    const done = window.setTimeout(() => setSwapping(null), SWAP_MS);
    return () => window.clearTimeout(done);
  }, [swapping]);
  return [swapping, setSwapping] as const;
}

/**
 * A finger's hold on a preview: `start` runs `then` after `HOLD_MS` unless the finger lifts first.
 * The click that ends a hold isn't a tap on the preview: `swallow` says so once, and the next tap
 * counts again.
 */
export function useHold() {
  const timer = useRef<number | undefined>(undefined);
  const held = useRef(false);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return {
    start(then: () => void) {
      window.clearTimeout(timer.current);
      held.current = false;
      timer.current = window.setTimeout(() => {
        held.current = true;
        then();
      }, HOLD_MS);
    },
    cancel() {
      window.clearTimeout(timer.current);
    },
    swallow() {
      const was = held.current;
      held.current = false;
      return was;
    },
  };
}

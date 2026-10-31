import { useEffect, useState } from "react";
import { ROLL_MS } from "../constants/dropdown.constants";

/** A panel's roll: it stays on the page while it rolls up, and unrolls a frame after it appears. */
export function useRoll(open: boolean) {
  const [mounted, setMounted] = useState(open);
  const [unrolled, setUnrolled] = useState(false);

  if (open && !mounted) setMounted(true);
  if (!open && unrolled) setUnrolled(false);

  useEffect(() => {
    if (open) {
      // One frame rolled up, then unroll: the height has something to animate from.
      const frame = requestAnimationFrame(() => setUnrolled(true));
      return () => cancelAnimationFrame(frame);
    }
    const timer = window.setTimeout(() => setMounted(false), ROLL_MS);
    return () => window.clearTimeout(timer);
  }, [open]);

  return { mounted, rolledOut: unrolled && open };
}

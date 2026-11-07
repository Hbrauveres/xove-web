import { useEffect, useState } from "react";
import { SWAP_MS } from "../constants/stage-also-live.constants";

/** Whose swap is playing, for a moment, and starting one. */
export function useSwapping() {
  const [swapping, setSwapping] = useState<string | null>(null);
  useEffect(() => {
    if (!swapping) return;
    const done = window.setTimeout(() => setSwapping(null), SWAP_MS);
    return () => window.clearTimeout(done);
  }, [swapping]);
  return [swapping, setSwapping] as const;
}

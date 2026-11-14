import { useCallback, useEffect, useState } from "react";
import { HEAR_S, SECOND_MS } from "../constants/settings-mic-test.constants";

/** Test's countdown: started, it counts the seconds left down to none; stopped, it's none at once. */
export function useHearCountdown() {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (left <= 0) return;
    const tick = window.setTimeout(() => setLeft(left - 1), SECOND_MS);
    return () => window.clearTimeout(tick);
  }, [left]);
  const start = useCallback(() => setLeft(HEAR_S), []);
  const stop = useCallback(() => setLeft(0), []);
  return { left, start, stop };
}

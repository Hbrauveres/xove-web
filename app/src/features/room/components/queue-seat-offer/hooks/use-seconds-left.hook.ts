import { useEffect, useState } from "react";
import { TICK_MS } from "../constants/queue-seat-offer.constants";
import { secondsLeft } from "../utils/seconds-left.util";

/**
 * The seconds left, counted from when the answer arrived on this browser's own clock (a wrong
 * clock can't shorten it). Every poll brings the API's count again, and the count starts over.
 */
export function useSecondsLeft(seconds: number): number {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    const deadline = Date.now() + seconds * TICK_MS;
    const tick = () => setLeft(secondsLeft(deadline, Date.now()));
    tick();
    const timer = window.setInterval(tick, TICK_MS);
    return () => window.clearInterval(timer);
  }, [seconds]);
  return left;
}

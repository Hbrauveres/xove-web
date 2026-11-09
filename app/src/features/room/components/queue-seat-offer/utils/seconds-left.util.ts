import { TICK_MS } from "../constants/queue-seat-offer.constants";

/** Whole seconds until the deadline, rounded up, never below zero. */
export const secondsLeft = (deadline: number, now: number): number =>
  Math.max(0, Math.ceil((deadline - now) / TICK_MS));

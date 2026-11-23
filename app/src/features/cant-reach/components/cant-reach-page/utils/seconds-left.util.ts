import { TICK_MS } from "../constants/cant-reach.constants";

/** Whole seconds until `at`, rounded up so the count never shows 0 before the try: 0 once it's due. */
export const secondsLeft = (at: number, now: number) => Math.max(0, Math.ceil((at - now) / TICK_MS));

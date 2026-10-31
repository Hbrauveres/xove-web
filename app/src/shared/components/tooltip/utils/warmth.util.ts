import { WARM_MS } from "../constants/tooltip.constants";

let warmUntil = 0;

/** Whether a tooltip just hid, so the next one shows at once. */
export const isWarm = () => Date.now() < warmUntil;

/** A tooltip hid: the next along the row shows at once for a moment. */
export function warmUp() {
  warmUntil = Date.now() + WARM_MS;
}

/** Only for tests: no tooltip hid just now, so the next one waits for its rest. */
export function resetTooltipWarmth() {
  warmUntil = 0;
}

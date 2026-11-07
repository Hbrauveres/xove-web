// The times the cases spend, and waiting for the page to be still. A case waits for a condition; it
// spends a time only where the behaviour is that time (a rest, a hold, a fade after the mouse stops),
// and then the time is named once, here: the app's own constant wherever the app has one (ADR-0102).
import { expect, type Locator, type Page } from "@playwright/test";

export {
  CHROME_IDLE_MS,
  FOLD_MS,
} from "../../src/features/room/components/stage-player/constants/stage-player.constants.ts";
export { LEAVE_GRACE_MS, OPEN_DELAY_MS, TIP_REST_MS, WARM_MS } from "../../src/shared/constants/floating.constants.ts";
export { IDLE_MS, LEAVE_MS, REST_MS } from "../../src/features/room/constants/sound-slider.constants.ts";
export { ROLL_MS } from "../../src/shared/components/dropdown/constants/dropdown.constants.ts";
export { TOAST_MS } from "../../src/shared/stores/toast-store/constants/toast.constants.ts";

/** How often a wait for a condition looks again (ms): about a frame, so it sees what a person would. */
export const LOOK_EVERY_MS = 16;

/** How long a wait for the page to be still may take before the case fails (ms). */
const STILL_TIMEOUT_MS = 10_000;

export interface StillOptions {
  /** Only transitions of this property count (a talking cue keeps its shadow moving, say). */
  property?: string;
}

/**
 * Waits until nothing finite is moving in `scope` (the whole page, or one part with what's inside
 * it): no CSS transition or animation with an end still running, two frames after each look. What
 * runs forever (a spinner, the static's loop) doesn't count.
 */
export async function untilStill(scope: Page | Locator, { property }: StillOptions = {}): Promise<void> {
  const root = "page" in scope ? scope.first() : scope.locator(":root");
  const moving = () =>
    root.evaluate(async (el, property) => {
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      return el.getAnimations({ subtree: true }).filter((a) => {
        if (a.playState !== "running") return false;
        if (!Number.isFinite(Number(a.effect?.getComputedTiming().endTime))) return false;
        return property === null || !(a instanceof CSSTransition) || a.transitionProperty === property;
      }).length;
    }, property ?? null);
  await expect.poll(moving, { intervals: [LOOK_EVERY_MS], timeout: STILL_TIMEOUT_MS }).toBe(0);
}

/** Spends exactly `ms` of real time: only where the behaviour is a time, named by its constant. */
export const spend = (page: Page, ms: number): Promise<void> => page.waitForTimeout(ms);

// The times the cases spend, and waiting for the page to be still. A case waits for a condition; it
// spends a time only where the behaviour is that time (a rest, a hold, a fade after the mouse stops),
// and then the time is named once, here: the app's own constant wherever the app has one (ADR-0102).
import { expect, type Locator, type Page } from "@playwright/test";
import { OPEN_DELAY_MS, TIP_REST_MS } from "../../src/shared/constants/floating.constants.ts";
import { REST_MS } from "../../src/features/room/constants/sound-slider.constants.ts";

export { CHROME_IDLE_MS } from "../../src/features/room/components/stage/stage-player/constants/stage-player.constants.ts";
export { LEAVE_GRACE_MS, OPEN_DELAY_MS, TIP_REST_MS } from "../../src/shared/constants/floating.constants.ts";
export { REST_MS } from "../../src/features/room/constants/sound-slider.constants.ts";
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

/** One frame at 60 Hz (ms): how early a measured moment may land against the app's own time. */
export const FRAME_MS = 1000 / 60;

/** How far a time measured from the tests (a toast's stay) may drift from the app's (ms). */
export const TIME_SLACK_MS = 300;

/**
 * The longest a resting pointer waits before something opens over what it rests on: a tooltip, a
 * live button's drop-up, a sound's slider (ms).
 */
export const HOVER_REST_MS = Math.max(TIP_REST_MS, OPEN_DELAY_MS, REST_MS);

/** How far from its time a page's timer may be seen to fire, from the test's side (ms). */
export const TIMER_SLACK_MS = 250;

/** How long the mic test plays my voice back (ms): MicTest's HEAR_S, which the app doesn't export. */
export const HEAR_YOURSELF_MS = 5000;

export { TOTAL_MS as WORDMARK_MS } from "../../src/shared/components/wordmark/utils/mark-timeline.util.ts";

/** How often the mic's meter reads the level (ms): the app's METER_MS, whose file the tests can't load. */
export const METER_MS = 50;

/** Waits until the page has drawn `count` more frames: what moves every frame has moved by then. */
export const afterFrames = (page: Page, count: number): Promise<void> =>
  page.evaluate(
    (count) =>
      new Promise<void>((done) => {
        let left = count;
        const next = () => (--left > 0 ? requestAnimationFrame(next) : done());
        requestAnimationFrame(next);
      }),
    count,
  );

/** How long a case listens to a fake voice's talking pattern: several of its starts and stops. */
export const VOICE_LISTEN_MS = 4000;
/**
 * A voice just turned on: its noise gate runs a moment on the default line before mine is applied,
 * then holds; past this, it follows my line (ms).
 */
export const VOICE_SETTLE_MS = 1000;

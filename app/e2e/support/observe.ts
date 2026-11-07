// One case's record at one size: the named elements' state before and after the action, a screenshot
// of each, every animation frame while it happens (track.ts) and a strip of screenshots through it.
// Written under E2E_OUT/observations/<case>/<size>/, where the comparison and the report read them.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Locator, Page, TestInfo } from "@playwright/test";
import type { Frame } from "./frames.ts";
import { stateOf, type ElementState } from "./state.ts";
import { spend, untilStill } from "./timing.ts";
import { startTracking } from "./track.ts";

/** How much longer than strip × gap the strip may take before it stops (ms). */
const STRIP_SLACK_MS = 400;

export interface Observation {
  before: Record<string, ElementState>;
  after: Record<string, ElementState>;
  frames: Frame[];
}

export interface ObserveOptions {
  /** How many screenshots the strip takes through the change, and how far apart (ms): its cadence. */
  strip?: number;
  gap?: number;
  /**
   * After the action, the recording runs until the page is still; `settle` keeps it running that
   * much longer, for a behaviour that is a time (ms, a named constant from timing.ts).
   */
  settle?: number;
}

/** The case id from a test's title: "F-stage-controls.3 the icon stays" → "F-stage-controls.3". */
export const caseOf = (info: TestInfo) => info.title.split(" ")[0] ?? info.title;

/** Records `action` on `page`, watching `targets`; returns what it saw. */
export async function observe(
  page: Page,
  info: TestInfo,
  targets: Record<string, Locator>,
  action: () => Promise<void>,
  { strip = 8, gap = 40, settle = 0 }: ObserveOptions = {},
): Promise<Observation> {
  const dir = join(process.env.E2E_OUT ?? "test-results", "observations", caseOf(info), info.project.name);
  mkdirSync(dir, { recursive: true });
  const before = await stateOf(targets);
  await page.screenshot({ path: join(dir, "before.png") });
  const stop = await startTracking(page, targets);
  // The strip is for the eye: small shots (CSS pixels, JPEG) and a time limit, so on a big screen it
  // doesn't outlast what it watches (the controls fade ~2.5 s after the last move).
  const until = Date.now() + strip * gap + STRIP_SLACK_MS;
  const shoot = async () => {
    for (let i = 0; i < strip && Date.now() < until; i++) {
      await page.screenshot({
        path: join(dir, `strip-${String(i).padStart(2, "0")}.jpg`),
        scale: "css",
        type: "jpeg",
        quality: 70,
      });
      await spend(page, gap);
    }
  };
  await Promise.all([action(), shoot()]);
  await untilStill(page);
  if (settle) await spend(page, settle);
  const frames = await stop();
  const after = await stateOf(targets);
  await page.screenshot({ path: join(dir, "after.png") });
  const record: Observation = { before, after, frames };
  writeFileSync(join(dir, "state.json"), JSON.stringify({ case: caseOf(info), size: info.project.name, ...record }));
  return record;
}

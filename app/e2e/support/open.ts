// Opens the harness on a scene, at the test's size, ready to be checked: the clock fixed (the
// durations on screen don't run), the pictures still, the room panel hidden, the fonts loaded, and
// the scene settled: its people in, its picture playing, nothing left moving.
import { expect, type Page } from "@playwright/test";
import { hooksReady } from "./harness.ts";
import { boxOf, centreX, centreY } from "./geometry.ts";
import { chromeOf, stageOf } from "./stage.ts";
import { untilStill } from "./timing.ts";

/** The moment every test lives in, so times on screen ("1:12:43", "18 min") read the same each run. */
export const FIXED_TIME = new Date("2026-11-07T20:00:00-03:00");

/** The scenes with someone live: the stage plays a picture once they're settled. */
const LIVE_SCENES = new Set(["live", "facecam", "portrait"]);

/** The video has its current frame (HTMLMediaElement.HAVE_CURRENT_DATA). */
const HAS_FRAME = 2;

export interface SceneOptions {
  /** Pictures drawn once and held (default), or moving like real streams. */
  still?: boolean;
}

/** Waits until the scene is settled: the page or the room up, its picture playing, nothing moving. */
async function settled(page: Page, query: string): Promise<void> {
  const params = new URLSearchParams(query);
  const other = params.get("page");
  if (other !== null && other !== "room") {
    await page.getByRole("heading").first().waitFor();
  } else {
    await hooksReady(page);
    await stageOf(page).waitFor();
    if (LIVE_SCENES.has(params.get("s") ?? "")) {
      // The big stream's video, by its spoken name ("Marina's shared screen"), with a frame to show.
      const video = stageOf(page)
        .getByLabel(/^(Your|.+'s) (shared screen|camera)$/)
        .first();
      await video.waitFor();
      await expect
        .poll(() => video.evaluate((v) => (v instanceof HTMLVideoElement ? v.readyState : 0)))
        .toBeGreaterThanOrEqual(HAS_FRAME);
    }
  }
  await untilStill(page);
}

/**
 * The harness at `query` (its `?s=`, `&page=` options, without the `?`), settled. Pictures are still
 * unless asked otherwise.
 */
export async function openScene(page: Page, query: string, { still = true }: SceneOptions = {}): Promise<void> {
  await page.clock.setFixedTime(FIXED_TIME);
  const extra = still ? "&panel=0&still=1" : "&panel=0";
  await page.goto(`/?${query}${extra}`);
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await settled(page, query);
}

/**
 * Wakes the stage's controls with a small move over it, as a person moving the mouse would, and
 * waits until they're shown and their fade-in is over.
 */
export async function wakeStage(page: Page): Promise<void> {
  const stage = await boxOf(stageOf(page));
  const x = centreX(stage);
  const y = centreY(stage);
  await page.mouse.move(x, y);
  await page.mouse.move(x + 5, y + 3);
  // Over a stream its controls say "shown"; the empty stage's never fade, and say nothing.
  if (await chromeOf(page).count()) await expect(chromeOf(page)).toHaveAttribute("data-chrome", "shown");
  await untilStill(stageOf(page), { property: "opacity" });
}

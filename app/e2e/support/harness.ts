// The harness's own knobs: what the fake room does while a case runs (people starting and stopping,
// the room's sound asked to start), a stream of another shape, and a voice turned on from the
// harness's room panel. Actions on the fakes, never readings of the app.
import type { Page } from "@playwright/test";
import { boxOf } from "./geometry.ts";
import { pictureOf, stageOf } from "./stage.ts";
import { untilStill } from "./timing.ts";

/** The hooks the harness puts on `window.__xove` once its people have joined (harness/main.tsx). */
interface Hooks {
  everyoneStops: () => void;
  marinaGoesLive: () => void;
  soundStarts: () => number;
}

/** Waits for the harness's hooks: its fake room is up and its people have joined. */
export const hooksReady = (page: Page): Promise<unknown> => page.waitForFunction(() => "__xove" in window);

/** Everyone live stops sharing: the stage goes empty. */
export async function everyoneStops(page: Page): Promise<void> {
  await hooksReady(page);
  await page.evaluate(() => (window as unknown as { __xove: Hooks }).__xove.everyoneStops());
}

/** Marina starts sharing her screen. */
export async function marinaGoesLive(page: Page): Promise<void> {
  await hooksReady(page);
  await page.evaluate(() => (window as unknown as { __xove: Hooks }).__xove.marinaGoesLive());
}

/** How many times the room has been asked to start its sound (LiveKit's `startAudio`). */
export async function soundStarts(page: Page): Promise<number> {
  await hooksReady(page);
  return page.evaluate(() => (window as unknown as { __xove: Hooks }).__xove.soundStarts());
}

/**
 * The picture in this shape (width ÷ height), as a stream of that shape would make it. The
 * harness's pictures are 16:9 and 9:16; the stage's box takes its picture's shape from `--shape`,
 * so this knob sets it there. The one place a case reaches into the stage's markup: to act as a
 * stream would, never to read the page.
 */
export async function setShape(page: Page, shape: number): Promise<void> {
  await page.evaluate((s) => {
    const box = document.querySelector<HTMLElement>('section[aria-label="Shared screen"] > div');
    if (!box) throw new Error("No stage to shape");
    box.style.setProperty("--shape", String(s));
  }, shape);
}

/**
 * Someone's voice turned on from the harness's room panel (the scene opened with `panel=1`), the
 * panel kept off the screen; they then talk on their own pattern.
 */
export async function voiceOn(page: Page, userId: number): Promise<void> {
  await page.addStyleTag({ content: "#xr-tab, #xr-panel { display: none !important; }" });
  await page.evaluate((id) => {
    const button = document.querySelector<HTMLButtonElement>(`#xr-panel [data-voice="${id}"]`);
    if (!button) throw new Error(`The room panel has no voice for person ${id}`);
    button.click();
  }, userId);
}

/** How many times the picture's shape is corrected to land on a width. */
const SHAPE_TRIES = 4;

/**
 * The picture this wide (CSS px), as a stream that narrow would make it, its glide over. A width in
 * CSS px is the same at every size (the controls fold by the picture's px, not its ratio); how tall a
 * narrow picture gets depends on the stage (a portrait monitor's is far taller), so the shape is
 * set, the picture's width measured once its glide is over, and corrected.
 */
export async function pictureWidth(page: Page, width: number): Promise<void> {
  const picture = pictureOf(page);
  let shape = width / (await boxOf(picture)).height;
  for (let i = 0; i < SHAPE_TRIES; i++) {
    await setShape(page, shape);
    await untilStill(stageOf(page));
    const now = (await boxOf(picture)).width;
    if (Math.abs(now - width) < 1) return;
    shape = (shape * width) / now;
  }
}

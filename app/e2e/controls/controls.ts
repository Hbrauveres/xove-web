// The stage's controls' own helpers: my stream, a narrow picture, a voice heard, and what an element
// shows (its icons, how opaque it reaches the screen, where its centre is).
import type { Locator, Page } from "@playwright/test";
import { openScene, wakeStage } from "../support/open.ts";

/** The stage's box, where the controls live. */
export const stageOf = (page: Page) => page.getByRole("region", { name: "Shared screen" });

/** The picture's layer: the picture's own size and place, holding every control over it. */
export const pictureOf = (page: Page) => page.locator("[data-on-picture]");

/** The stage's buttons, found as a person would: by role and name inside the stage (not by the
 * picture layer's marker, which a version before it doesn't have). Where a case needs them on the
 * picture, it checks that with `inside(…, pictureOf(page))`. */
export const control = (page: Page, name: string | RegExp) =>
  stageOf(page).getByRole("button", { name, exact: typeof name === "string" });

/** My own stream on the stage: from the empty stage, "Share your screen". */
export async function openMyStream(page: Page): Promise<void> {
  await openScene(page, "s=empty");
  await page.getByRole("button", { name: "Share your screen" }).first().click();
  await page.waitForTimeout(2500);
  await wakeStage(page);
}

/**
 * Marina's screen on the stage, her voice heard, talking on her own pattern: the harness's room panel
 * turns her voice on (the panel kept off the screen).
 */
export async function openWithVoice(page: Page, extra = ""): Promise<void> {
  await openScene(page, `s=live&panel=1${extra}`);
  await page.addStyleTag({ content: "#xr-tab, #xr-panel { display: none !important; }" });
  await page.evaluate(() => (document.querySelector('[data-voice="2"]') as HTMLButtonElement | null)?.click());
  await page.waitForTimeout(2500);
  await wakeStage(page);
}

/** How many times the picture's shape is corrected to land on a width. */
const SHAPE_TRIES = 4;
/** How often, and how many times, the picture's width is read while it glides. */
const SETTLE_POLL_MS = 150;
const SETTLE_POLLS = 20;

/** The picture this wide (CSS px), as a stream that narrow would make it. */
export async function shapePicture(page: Page, width: number): Promise<void> {
  // A width in CSS px, the same at every size (the controls fold by the picture's px, not its ratio).
  // How tall a narrow picture gets depends on the stage (a portrait monitor's is far taller), so the
  // stream's shape is set, the picture's width measured once its glide settles, and corrected.
  const frame = page.locator('section[aria-label="Shared screen"] > div').first();
  let shape = width / ((await pictureOf(page).boundingBox())?.height ?? width);
  for (let i = 0; i < SHAPE_TRIES; i++) {
    await frame.evaluate((el, s) => (el as HTMLElement).style.setProperty("--shape", String(s)), shape);
    const now = await settledWidth(page);
    if (Math.abs(now - width) < 1) break;
    shape = (shape * width) / now;
  }
  await wakeStage(page);
}

/** The picture's width once it stops changing (its glide over). */
async function settledWidth(page: Page): Promise<number> {
  let last = -1;
  for (let i = 0; i < SETTLE_POLLS; i++) {
    await page.waitForTimeout(SETTLE_POLL_MS);
    const w = (await pictureOf(page).boundingBox())?.width ?? 0;
    if (Math.abs(w - last) < 0.5) return w;
    last = w;
  }
  return last;
}

/** Moves the mouse onto the middle of `target`, as a person would, in a few steps. */
export async function pointAt(page: Page, target: Locator): Promise<void> {
  const b = await target.boundingBox();
  if (b) await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 4 });
}

/** Clicks the middle of `target` with the mouse, even a greyed (aria-disabled) control. */
export async function clickAt(page: Page, target: Locator): Promise<void> {
  const b = await target.boundingBox();
  if (b) await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
}

/** The names of the icons a control shows now (an icon hidden by its style isn't shown). */
export const shownIcons = (target: Locator) =>
  target.evaluate((el) =>
    [...el.querySelectorAll("svg")]
      .filter((s) => s.checkVisibility({ visibilityProperty: true }) && s.getBoundingClientRect().width > 0)
      .map((s) => s.getAttribute("data-icon")),
  );

/** How opaque an element reaches the screen: its opacity times its ancestors'. */
export const opacityOf = (target: Locator) =>
  target.evaluate((el) => {
    let o = 1;
    for (let e: Element | null = el; e; e = e.parentElement) o *= Number(getComputedStyle(e).opacity);
    return o;
  });

/** An element's box, or a zero box when it isn't there. */
export async function boxOf(target: Locator) {
  return (await target.boundingBox()) ?? { x: 0, y: 0, width: 0, height: 0 };
}

/** The vertical centre of an element's box. */
export const middleY = async (target: Locator) => {
  const b = await boxOf(target);
  return b.y + b.height / 2;
};

/** Whether `inner` lies inside `outer` (half a pixel of rounding allowed). */
export async function inside(inner: Locator, outer: Locator): Promise<boolean> {
  const i = await boxOf(inner);
  const o = await boxOf(outer);
  return (
    i.width > 0 &&
    i.x >= o.x - 0.5 &&
    i.y >= o.y - 0.5 &&
    i.x + i.width <= o.x + o.width + 0.5 &&
    i.y + i.height <= o.y + o.height + 0.5
  );
}

/** Whether a sound's own slider is open: unrolled, out of its inert holder. */
export const sliderOpen = (slider: Locator) =>
  slider.evaluate((el) => !el.closest("[inert]") && el.closest("[data-open]") !== null);

/** The tooltip on show now, if any. */
export const shownTip = (page: Page) => page.locator('[role="tooltip"][data-shown]');

/** Tabs through the page until `target` has the keyboard's focus (at most `max` presses). */
export async function tabTo(page: Page, target: Locator, max = 40): Promise<boolean> {
  for (let i = 0; i < max; i++) {
    await page.keyboard.press("Tab");
    if (await target.evaluate((el) => el === document.activeElement)) return true;
  }
  return false;
}

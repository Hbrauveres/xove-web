// What the settings' cases share: my own stream with the settings open over it, the panel and its
// parts, moving the pointer off to a calm spot, a record of controls greyed even for a moment, and
// parts of the page hidden while the glass is measured.
import { expect, type Locator, type Page } from "@playwright/test";
import { openScene, wakeStage } from "../support/open.ts";
import { boxOf } from "../support/geometry.ts";
import { pictureOf, stageOf } from "../support/stage.ts";
import { LEAVE_GRACE_MS, spend, untilStill } from "../support/timing.ts";

/** The settings panel. */
export const panelOf = (page: Page) => page.getByRole("dialog", { name: "Settings" });

/** A tab of the panel, by its words. */
export const tabOf = (page: Page, name: "Screen" | "Camera" | "Voice") =>
  panelOf(page).getByRole("tab", { name, exact: true });

/** My own round buttons on my stream. */
export function myButtons(page: Page) {
  return {
    screen: page.getByRole("button", { name: /^(Share your screen|Stop sharing your screen)$/ }),
    camera: page.getByRole("button", { name: /^(Turn on your camera|Turn off your camera)$/ }),
    voice: page.getByRole("button", { name: /^(Share your voice|Stop sharing your voice|Turn off your voice)$/ }),
    cog: page.getByRole("button", { name: "Settings", exact: true }),
  };
}

/** My own stream on the stage: the harness's room with nobody live, then my screen shared. */
export async function myStream(page: Page, query = "s=empty", { camera = false } = {}): Promise<void> {
  await openScene(page, query);
  await page.getByRole("button", { name: "Share your screen" }).first().click();
  await page.getByRole("button", { name: "Stop sharing your screen" }).waitFor();
  if (camera) {
    await page.getByRole("button", { name: "Turn on your camera" }).first().click();
    await page.getByRole("button", { name: "Turn off your camera" }).waitFor();
  }
  // My picture on the stage, its controls' layer in place.
  await stageOf(page).getByLabel("Your shared screen").waitFor();
  await pictureOf(page).waitFor();
  await wakeStage(page);
}

/** The settings opened from my stream's cog, its unrolling over. */
export async function openSettings(page: Page): Promise<void> {
  await wakeStage(page);
  await myButtons(page).cog.click();
  await panelOf(page).waitFor();
  await untilStill(panelOf(page));
}

/**
 * The pointer moved off to a calm spot of the stage, above the buttons and away from the panel,
 * past the leave grace: what it rested on counts as left.
 */
export async function moveAway(page: Page): Promise<void> {
  const stage = await boxOf(stageOf(page));
  await page.mouse.move(stage.x + stage.width * 0.15, stage.y + stage.height * 0.3, { steps: 4 });
  await spend(page, LEAVE_GRACE_MS);
  await untilStill(page);
}

/** Clicks an option of a segmented control (its words), as a person does. */
export const optionOf = (page: Page, group: string, option: string) =>
  page.getByRole("radiogroup", { name: group }).getByText(option, { exact: true });

/**
 * Starts recording every moment one of the page's buttons or fields turns greyed (disabled), even
 * for a single frame; the returned function stops and gives back the names of what did.
 */
export async function startGreyWatch(page: Page): Promise<() => Promise<string[]>> {
  await page.evaluate(() => {
    const seen: string[] = [];
    const name = (el: Element) =>
      el.getAttribute("aria-label") ||
      el.closest("label")?.textContent?.trim() ||
      el.textContent?.trim().slice(0, 40) ||
      el.tagName.toLowerCase();
    const observer = new MutationObserver((records) => {
      for (const r of records) {
        const el = r.target as Element;
        const on =
          r.attributeName === "disabled" ? el.hasAttribute("disabled") : el.getAttribute("aria-disabled") === "true";
        if (on) seen.push(name(el));
      }
    });
    observer.observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ["disabled", "aria-disabled"],
    });
    (window as unknown as { __grey: { seen: string[]; observer: MutationObserver } }).__grey = { seen, observer };
  });
  return () =>
    page.evaluate(() => {
      const grey = (window as unknown as { __grey: { seen: string[]; observer: MutationObserver } }).__grey;
      grey.observer.disconnect();
      return [...new Set(grey.seen)];
    });
}

/**
 * Hides what `selector` finds while measuring, by a CSS rule, once it's hidden; the returned
 * function puts it back and waits until it shows again.
 */
export async function hide(page: Page, selector: string): Promise<() => Promise<void>> {
  const target: Locator = page.locator(selector).first();
  const shown = await target.isVisible();
  const tag = await page.addStyleTag({ content: `${selector} { visibility: hidden !important; }` });
  await expect(target).toBeHidden();
  return async () => {
    await tag.evaluate((el) => (el as Element).remove());
    if (shown) await expect(target).toBeVisible();
  };
}

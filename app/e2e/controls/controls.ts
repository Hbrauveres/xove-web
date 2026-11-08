// The stage's controls' own helpers: my stream, a voice heard, what icons a control shows, whether a
// sound's slider is open, and where an element's centre is. The rest is in support/.
import type { Locator, Page } from "@playwright/test";
import { boxOf, centreY } from "../support/geometry.ts";
import { voiceOn } from "../support/harness.ts";
import { openScene, wakeStage } from "../support/open.ts";
import { control, stageOf } from "../support/stage.ts";
import { glassUnderBreakingParentsWhile } from "../support/glass.ts";
import { CHROME_IDLE_MS, spend, untilStill } from "../support/timing.ts";

/** My own stream on the stage: from the empty stage, "Share your screen"; its controls awake. */
export async function openMyStream(page: Page): Promise<void> {
  await openScene(page, "s=empty");
  await page.getByRole("button", { name: "Share your screen" }).first().click();
  await stageOf(page).getByLabel("Your shared screen").waitFor();
  await untilStill(page);
  await wakeStage(page);
}

/**
 * Marina's screen on the stage, her voice heard, talking on her own pattern: the harness's room panel
 * turns her voice on (the panel kept off the screen).
 */
export async function openWithVoice(page: Page, extra = ""): Promise<void> {
  await openScene(page, `s=live&panel=1${extra}`);
  await voiceOn(page, 2);
  await control(page, "Mute Marina's voice").waitFor({ state: "attached" });
  await untilStill(stageOf(page), { property: "opacity" });
  await wakeStage(page);
}

/** The names of the icons a control shows now (an icon hidden by its style isn't shown). */
export const shownIcons = (target: Locator) =>
  target.evaluate((el) =>
    [...el.querySelectorAll("svg")]
      .filter((s) => s.checkVisibility({ visibilityProperty: true }) && s.getBoundingClientRect().width > 0)
      .map((s) => s.getAttribute("data-icon")),
  );

/** The vertical centre of an element's box. */
export const middleY = async (target: Locator) => centreY(await boxOf(target));

/** Whether a sound's own slider is open: unrolled, out of its inert holder. */
export const sliderOpen = (slider: Locator) =>
  slider.evaluate((el) => !el.closest("[inert]") && el.closest("[data-open]") !== null);

/**
 * A menu opened by a click on `button`, then the pointer resting on it past the controls' wait. Returns
 * every glass found under a parent breaking its blur, while it opened and while the pointer rested.
 */
export async function openAndRestOnMenu(page: Page, button: Locator, menu: Locator) {
  const opening = await glassUnderBreakingParentsWhile(page, async () => {
    await button.click();
    await menu.waitFor();
    await untilStill(menu);
  });
  const resting = await glassUnderBreakingParentsWhile(page, async () => {
    await menu.hover();
    await spend(page, CHROME_IDLE_MS * 2);
  });
  return { opening, resting };
}

// What the header's cases share: the bar and its three buttons, their panels, and the room's streams
// stopping and starting (the harness's hooks) with the activity's news of it.
import type { Locator, Page } from "@playwright/test";
import * as harness from "../support/harness.ts";
import { wakeStage } from "../support/open.ts";
import { stageOf } from "../support/stage.ts";
import { untilStill } from "../support/timing.ts";

/** The header and its parts, found as a screen reader hears them. */
export function headerOf(page: Page) {
  const bar = page.getByRole("banner");
  return {
    bar,
    wordmark: bar.getByRole("img", { name: "Xovê" }),
    pill: bar.getByRole("button", { name: /^Activity/ }),
    people: bar.getByRole("button", { name: /people? here$/ }),
    me: bar.getByRole("button", { name: /: account, / }),
  };
}

/** The three panels, by their names. */
export const activityList = (page: Page) => page.getByRole("dialog", { name: "Activity" });
export const peoplePanel = (page: Page) => page.getByRole("dialog", { name: "Here now" });
export const myMenu = (page: Page) => page.getByRole("dialog", { name: "Account" });

/** A panel opened from its button, its unroll over. */
export async function openFrom(button: Locator, panel: Locator): Promise<void> {
  await button.click();
  await panel.waitFor();
  await untilStill(panel);
}

/** A panel rolled back up: it leaves the page once it's rolled up. */
export const rolledUp = (panel: Locator): Promise<void> => panel.waitFor({ state: "detached" });

/** The header's news settled: what slides into the pill is in place. */
const newsIn = (page: Page) => untilStill(headerOf(page).bar);

/** Every stream stops (the harness's hook), and the activity has the news. */
export async function everyoneStops(page: Page): Promise<void> {
  await harness.everyoneStops(page);
  await headerOf(page)
    .pill.and(page.getByRole("button", { name: /turned off their camera/ }))
    .waitFor();
  await newsIn(page);
}

/** Marina starts sharing her screen (the harness's hook), and the activity has the news. */
export async function marinaGoesLive(page: Page): Promise<void> {
  await harness.marinaGoesLive(page);
  await page.getByRole("button", { name: /^Activity: Marina started sharing/ }).waitFor();
  await newsIn(page);
}

/** I share my screen from the stage's Go live menu, and the stage shows it. */
export async function iShareMyScreen(page: Page): Promise<void> {
  await wakeStage(page);
  await page.getByRole("button", { name: "Go live" }).click();
  await page.getByRole("menuitem", { name: "Share your screen" }).click();
  await page.getByRole("button", { name: "Stop sharing your screen" }).waitFor();
  await page.getByRole("button", { name: /^Activity: You started sharing/ }).waitFor();
  await stageOf(page).locator(`video[aria-label="Your shared screen"]`).waitFor();
  await untilStill(page);
}

/** A computed style of the element. */
export const styleOf = (target: Locator, prop: string) =>
  target.first().evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), prop);

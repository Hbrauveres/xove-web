// The stage as a person meets it: its region, the picture playing on it, its buttons, the tooltip on
// show, and whether its controls are shown.
import type { Locator, Page } from "@playwright/test";

/** The stage: the region the shared screen plays in, with its controls. */
export const stageOf = (page: Page): Locator => page.getByRole("region", { name: "Shared screen" });

/** The picture's layer: the picture's own size and place, holding every control over it. */
export const pictureOf = (page: Page): Locator => page.locator("[data-on-picture]");

/** A stage's button, by its name (a string is the whole name). */
export const control = (page: Page, name: string | RegExp): Locator =>
  stageOf(page).getByRole("button", { name, exact: typeof name === "string" });

/**
 * Whether the stage's controls are shown: its `data-chrome` ("shown", "hidden"; absent on the empty
 * stage, whose controls never fade), the only sign of that state.
 */
export const chromeOf = (page: Page): Locator => stageOf(page).locator("[data-chrome]");

/** The tooltip on show now: a hidden one isn't in the accessibility tree. */
export const shownTip = (page: Page): Locator => page.getByRole("tooltip");

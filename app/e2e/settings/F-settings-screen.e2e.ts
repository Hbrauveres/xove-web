import { expect, test, type Page } from "@playwright/test";
import { blinks, drift } from "../support/frames.ts";
import { observe } from "../support/observe.ts";
import { myButtons, myStream, openSettings, optionOf, panelOf, restOn, startGreyWatch, tabOf } from "./settings.ts";

const NO_SOUND = "No sound is being shared. Share a tab, or a window with “Share this app's audio too”, with Change.";

/** Everything whose icon must hold still while an option is clicked: my round buttons and the tabs. */
function icons(page: Page) {
  const { screen, camera, voice, cog } = myButtons(page);
  return {
    screenIcon: screen.locator("svg").first(),
    cameraIcon: camera.locator("svg").first(),
    voiceIcon: voice.locator("svg").first(),
    cogIcon: cog.locator("svg").first(),
    screenTabIcon: tabOf(page, "Screen").locator("svg"),
    cameraTabIcon: tabOf(page, "Camera").locator("svg"),
    voiceTabIcon: tabOf(page, "Voice").locator("svg"),
    screenButton: screen,
    cameraButton: camera,
    change: panelOf(page).getByRole("button", { name: "Change" }),
    smooth: optionOf(page, "Screen mode", "Smooth"),
    best: optionOf(page, "Screen quality", "1080p"),
  };
}
const ICONS = ["screenIcon", "cameraIcon", "voiceIcon", "cogIcon", "screenTabIcon", "cameraTabIcon", "voiceTabIcon"];
/** And the controls beside the option: the other options and Change. */
const BESIDE = ["screenButton", "cameraButton", "change", "smooth", "best"];

test("F-settings-screen.1 while I share, the Screen tab shows what's shared and Change", async ({ page }, info) => {
  await myStream(page);
  await openSettings(page);
  const pane = panelOf(page).getByRole("tabpanel", { name: "Screen" });
  const change = pane.getByRole("button", { name: "Change" });
  const seen = await observe(page, info, { change }, async () => {
    await restOn(page, change, 600);
  });
  await expect.soft(pane.getByText("Window", { exact: true })).toBeVisible();
  await expect.soft(pane.getByText("Your screen", { exact: true })).toBeVisible();
  await expect.soft(change).toBeVisible();
  await expect.soft(change).toBeEnabled();
  // What Change does, in its tooltip.
  await expect
    .soft(page.locator('[role="tooltip"][data-shown]'))
    .toHaveText("Pick another window or tab; viewers keep watching the same stream");
  expect.soft(drift(seen.frames, "change")).toBeLessThan(1);
});

test("F-settings-screen.2 a screen shared without sound says how to share it", async ({ page }, info) => {
  await myStream(page);
  await openSettings(page);
  const pane = panelOf(page).getByRole("tabpanel", { name: "Screen" });
  const note = pane.getByText(NO_SOUND);
  await observe(page, info, { note }, async () => {
    await page.mouse.move(5, 5);
  });
  await expect.soft(note).toBeVisible();
  // Said once on the tab.
  await expect.soft(pane.getByText(NO_SOUND)).toHaveCount(1);
});

test("F-settings-screen.3 Change picks again and keeps me sharing, the settings open", async ({ page }, info) => {
  await myStream(page);
  await openSettings(page);
  const change = panelOf(page).getByRole("button", { name: "Change" });
  const stop = page.getByRole("button", { name: "Stop sharing your screen" });
  const seen = await observe(page, info, { change, stop }, async () => {
    await change.click();
    await page.waitForTimeout(600);
  });
  await expect.soft(stop).toHaveAttribute("aria-pressed", "true");
  await expect.soft(panelOf(page)).toBeVisible();
  await expect.soft(tabOf(page, "Screen")).toHaveAttribute("aria-selected", "true");
  expect.soft(drift(seen.frames, "stop")).toBeLessThan(1);
});

test("F-settings-screen.4 not sharing, the Screen tab says its settings are for next time", async ({ page }, info) => {
  await myStream(page);
  await page.getByRole("button", { name: "Stop sharing your screen" }).click();
  // My screen stopped: the empty stage's cog opens the same settings.
  await page.getByRole("button", { name: "Share your screen" }).first().waitFor();
  await page.waitForTimeout(500);
  const cog = page.getByRole("button", { name: "Settings", exact: true });
  await observe(page, info, { cog }, async () => {
    await cog.click();
    await panelOf(page).waitFor();
  });
  const pane = panelOf(page).getByRole("tabpanel", { name: "Screen" });
  await expect
    .soft(
      pane.getByText(
        "You're not sharing. These are used the next time you do; the browser shows a preview when you pick what to share.",
      ),
    )
    .toBeVisible();
  await expect.soft(pane.getByRole("button", { name: "Change" })).toHaveCount(0);
  await expect.soft(pane.getByText(NO_SOUND)).toHaveCount(0);
  await expect.soft(page.getByRole("radiogroup", { name: "Screen quality" })).toBeVisible();
});

test("F-settings-screen.5 the qualities are 1080p, 720p and 480p; a click picks one", async ({ page }, info) => {
  await myStream(page);
  await openSettings(page);
  const group = page.getByRole("radiogroup", { name: "Screen quality" });
  await expect.soft(group.getByRole("radio")).toHaveCount(3);
  await expect.soft(group.getByRole("radio", { name: "1080p" })).toBeChecked();
  const option = optionOf(page, "Screen quality", "720p");
  const seen = await observe(page, info, { option }, async () => {
    await option.click();
  });
  await expect.soft(group.getByRole("radio", { name: "720p" })).toBeChecked();
  await expect.soft(group.getByRole("radio", { name: "1080p" })).not.toBeChecked();
  expect.soft(drift(seen.frames, "option")).toBeLessThan(1);
  // Still live, on the panel's tab.
  await expect.soft(page.getByRole("button", { name: "Stop sharing your screen" })).toBeVisible();
  await expect.soft(tabOf(page, "Screen")).toHaveAttribute("aria-selected", "true");
});

test("F-settings-screen.6 clicking a quality changes only that: no icon blinks, nothing greys", async ({
  page,
}, info) => {
  await myStream(page, "s=empty", { camera: true });
  await openSettings(page);
  const option = optionOf(page, "Screen quality", "720p");
  const stopGrey = await startGreyWatch(page);
  const seen = await observe(page, info, { ...icons(page), option }, async () => {
    await option.click();
  });
  const greyed = await stopGrey();
  for (const name of [...ICONS, ...BESIDE]) expect.soft(blinks(seen.frames, name), name).toEqual([]);
  // Nothing else turns unavailable, not even for a frame.
  expect.soft(greyed).toEqual([]);
});

test("F-settings-screen.7 clicking a mode changes only that: no icon blinks, nothing greys", async ({ page }, info) => {
  await myStream(page, "s=empty", { camera: true });
  await openSettings(page);
  const group = page.getByRole("radiogroup", { name: "Screen mode" });
  await expect.soft(group.getByRole("radio", { name: "Smooth" })).toBeChecked();
  const option = optionOf(page, "Screen mode", "Sharp");
  const stopGrey = await startGreyWatch(page);
  const seen = await observe(page, info, { ...icons(page), option }, async () => {
    await option.click();
  });
  const greyed = await stopGrey();
  await expect.soft(group.getByRole("radio", { name: "Sharp" })).toBeChecked();
  for (const name of [...ICONS, ...BESIDE]) expect.soft(blinks(seen.frames, name), name).toEqual([]);
  expect.soft(greyed).toEqual([]);
});

test("F-settings-screen.8 the chosen quality and mode are remembered", async ({ page }, info) => {
  await myStream(page);
  await openSettings(page);
  await optionOf(page, "Screen quality", "480p").click();
  await optionOf(page, "Screen mode", "Sharp").click();
  await page.keyboard.press("Escape");
  await expect.soft(panelOf(page)).toHaveCount(0);
  const cog = myButtons(page).cog;
  await observe(page, info, { cog }, async () => {
    await openSettings(page);
  });
  await expect
    .soft(page.getByRole("radiogroup", { name: "Screen quality" }).getByRole("radio", { name: "480p" }))
    .toBeChecked();
  await expect
    .soft(page.getByRole("radiogroup", { name: "Screen mode" }).getByRole("radio", { name: "Sharp" }))
    .toBeChecked();
  // And after the page loads again.
  await myStream(page);
  await openSettings(page);
  await expect
    .soft(page.getByRole("radiogroup", { name: "Screen quality" }).getByRole("radio", { name: "480p" }))
    .toBeChecked();
  await expect
    .soft(page.getByRole("radiogroup", { name: "Screen mode" }).getByRole("radio", { name: "Sharp" }))
    .toBeChecked();
});

test("F-settings-screen.9 the arrow keys move the quality, one tab stop", async ({ page }, info) => {
  await myStream(page);
  await openSettings(page);
  const group = page.getByRole("radiogroup", { name: "Screen quality" });
  const first = group.getByRole("radio", { name: "1080p" });
  await first.focus();
  await observe(page, info, { group }, async () => {
    await page.keyboard.press("ArrowRight");
  });
  await expect.soft(group.getByRole("radio", { name: "720p" })).toBeChecked();
  await expect.soft(group.getByRole("radio", { name: "720p" })).toBeFocused();
});

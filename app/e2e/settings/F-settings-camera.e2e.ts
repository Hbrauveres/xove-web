import { expect, test, type Locator, type Page } from "@playwright/test";
import { blinks, drift } from "../support/frames.ts";
import { boxOf } from "../support/geometry.ts";
import { observe } from "../support/observe.ts";
import { untilStill } from "../support/timing.ts";
import { myButtons, myStream, openSettings, optionOf, panelOf, tabOf } from "./settings.ts";

/** The camera's preview in the panel. */
const previewOf = (page: Page) => panelOf(page).getByLabel("Your camera");

/** Whether the preview plays a picture: my camera's live track, turned on for it. */
const previewPlays = (page: Page) =>
  previewOf(page).evaluate(
    (v) =>
      v instanceof HTMLVideoElement &&
      v.srcObject instanceof MediaStream &&
      v.srcObject.getVideoTracks().some((t) => t.readyState === "live") &&
      v.videoWidth > 0,
  );

/** The Camera tab chosen, its preview playing and the panel still. */
async function onCameraTab(page: Page) {
  await tabOf(page, "Camera").click();
  await expect(tabOf(page, "Camera")).toHaveAttribute("aria-selected", "true");
  await expect.poll(() => previewPlays(page)).toBe(true);
  await untilStill(panelOf(page));
}

/** The Camera tab of the settings, open. */
async function cameraTab(page: Page, query = "s=empty", camera = false) {
  await myStream(page, query, { camera });
  await openSettings(page);
  await onCameraTab(page);
  return panelOf(page).getByRole("tabpanel", { name: "Camera" });
}

/** A picker's list opened by a click, its unrolling over. */
async function openList(page: Page, pill: Locator) {
  await pill.click();
  const list = page.getByRole("menu", { name: "Camera" });
  await list.waitFor();
  await untilStill(list);
}

test("F-settings-camera.1 with my camera off, the tab previews it for me alone", async ({ page }, info) => {
  await myStream(page);
  await openSettings(page);
  const preview = previewOf(page);
  const only = panelOf(page).getByText("Only you see this", { exact: true });
  const seen = await observe(page, info, { preview, only, tab: tabOf(page, "Camera") }, async () => {
    await onCameraTab(page);
  });
  await expect.soft(preview).toBeVisible();
  await expect.soft(only).toBeVisible();
  // The picture is playing: my camera, turned on for the preview.
  expect.soft(await previewPlays(page)).toBe(true);
  // A 16:9 box, inside the panel.
  const b = await boxOf(preview);
  expect.soft(b.width / b.height).toBeCloseTo(16 / 9, 1);
  // Not sent: my camera button is still off, and the tab has no red dot.
  await expect.soft(myButtons(page).camera).toHaveAccessibleName("Turn on your camera");
  await expect.soft(tabOf(page, "Camera").locator("[data-live]")).toHaveCount(0);
  await expect.soft(panelOf(page).getByText("LIVE", { exact: true })).toHaveCount(0);
  expect.soft(drift(seen.frames, "tab")).toBeLessThan(1);
});

test("F-settings-camera.2 with my camera live, the preview says LIVE", async ({ page }, info) => {
  const pane = await cameraTab(page, "s=empty", true);
  const live = pane.getByText("LIVE", { exact: true });
  await observe(page, info, { live }, async () => {
    await page.mouse.move(5, 5);
  });
  await expect.soft(live).toBeVisible();
  await expect.soft(pane.getByText("Only you see this", { exact: true })).toHaveCount(0);
  await expect.soft(pane.getByLabel("Your camera")).toBeVisible();
  await expect.soft(tabOf(page, "Camera").locator("[data-live]")).toBeVisible();
});

test("F-settings-camera.3 the camera picker lists my cameras and picks one", async ({ page }, info) => {
  const pane = await cameraTab(page);
  const pill = pane.getByRole("button", { name: /^Camera: / });
  await expect.soft(pill).toHaveAccessibleName("Camera: Webcam C920");
  const quality = optionOf(page, "Camera quality", "720p");
  // On a short window the panel scrolls: brought into view first, as a person would, so the drift
  // measured is the action's alone.
  await pill.scrollIntoViewIfNeeded();
  const seen = await observe(page, info, { pill, quality }, async () => {
    await openList(page, pill);
  });
  const list = page.getByRole("menu", { name: "Camera" });
  await expect.soft(list).toBeVisible();
  // The chosen camera stays in the pill and isn't repeated in the list.
  await expect.soft(list.getByRole("menuitemradio", { name: "Webcam C920" })).toHaveCount(0);
  await expect.soft(list.getByRole("menuitemradio", { name: "OBS Virtual Camera" })).toBeVisible();
  // The list floats: nothing under it moves.
  expect.soft(drift(seen.frames, "pill")).toBeLessThan(1);
  expect.soft(drift(seen.frames, "quality")).toBeLessThan(1);
  await list.getByRole("menuitemradio", { name: "OBS Virtual Camera" }).click();
  await expect.soft(list).toHaveCount(0);
  await expect.soft(pill).toHaveAccessibleName("Camera: OBS Virtual Camera");
  // Remembered: the panel reopened shows it.
  await page.keyboard.press("Escape");
  await openSettings(page);
  await tabOf(page, "Camera").click();
  await expect.soft(pill).toHaveAccessibleName("Camera: OBS Virtual Camera");
});

test("F-settings-camera.4 long camera names keep to one line and never widen the picker", async ({ page }, info) => {
  const pane = await cameraTab(page, "s=empty&cams=emeet");
  const pill = pane.getByRole("button", { name: /^Camera: / });
  await expect.soft(pill).toHaveAccessibleName("Camera: EMEET STUDIO Virtual Camera");
  // On a short window the panel scrolls: brought into view first, as a person would, so the drift
  // measured is the action's alone.
  await pill.scrollIntoViewIfNeeded();
  const before = await boxOf(pill);
  const seen = await observe(page, info, { pill }, async () => {
    await openList(page, pill);
  });
  const option = page
    .getByRole("menu", { name: "Camera" })
    .getByRole("menuitemradio", { name: "EMEET PIXY (328f:00c0)" });
  await expect.soft(option).toBeVisible();
  const panel = await boxOf(panelOf(page));
  const after = await boxOf(pill);
  const o = await boxOf(option);
  // One width, whatever the names: inside the panel, as wide open as closed.
  expect.soft(after.width).toBeCloseTo(before.width, 0);
  expect.soft(o.x + o.width).toBeLessThanOrEqual(panel.x + panel.width + 0.5);
  expect.soft(after.x + after.width).toBeLessThanOrEqual(panel.x + panel.width + 0.5);
  // On one line: the option is a single row's height.
  expect.soft(o.height).toBeLessThanOrEqual(before.height + 1);
  expect.soft(drift(seen.frames, "pill")).toBeLessThan(1);
});

test("F-settings-camera.5 the camera's qualities are 720p and 480p, and its modes Smooth and Sharp", async ({
  page,
}, info) => {
  await cameraTab(page);
  const quality = page.getByRole("radiogroup", { name: "Camera quality" });
  const mode = page.getByRole("radiogroup", { name: "Camera mode" });
  await expect.soft(quality.getByRole("radio")).toHaveCount(2);
  await expect.soft(quality.getByRole("radio", { name: "720p" })).toBeChecked();
  await expect.soft(quality.getByRole("radio", { name: "1080p" })).toHaveCount(0);
  await expect.soft(mode.getByRole("radio", { name: "Smooth" })).toBeChecked();
  const option = optionOf(page, "Camera quality", "480p");
  await observe(page, info, { option }, async () => {
    await option.click();
  });
  await expect.soft(quality.getByRole("radio", { name: "480p" })).toBeChecked();
  // The screen's own settings don't follow.
  const screenBest = page
    .getByRole("radiogroup", { name: "Screen quality", includeHidden: true })
    .getByRole("radio", { name: "1080p", includeHidden: true });
  await expect.soft(screenBest).toBeChecked();
});

test("F-settings-camera.6 leaving the Camera tab ends the preview; my camera was never sent", async ({
  page,
}, info) => {
  const pane = await cameraTab(page);
  const preview = pane.getByLabel("Your camera");
  await expect.soft(preview).toBeVisible();
  const seen = await observe(page, info, { screenTab: tabOf(page, "Screen"), preview }, async () => {
    await tabOf(page, "Screen").click();
    await expect(tabOf(page, "Screen")).toHaveAttribute("aria-selected", "true");
  });
  // The preview is gone with the tab. (Whether the camera itself is released can't be read here: the
  // test fake's detach leaves the element's picture in place, as a real track's wouldn't.)
  await expect.soft(previewOf(page)).toBeHidden();
  await expect.soft(myButtons(page).camera).toHaveAccessibleName("Turn on your camera");
  await expect.soft(page.getByRole("figure", { name: /^1 of 6 live/ })).toBeVisible();
  expect.soft(blinks(seen.frames, "screenTab")).toEqual([]);
});

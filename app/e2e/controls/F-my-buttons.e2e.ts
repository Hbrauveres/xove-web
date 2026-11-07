import { expect, test, type Locator, type Page } from "@playwright/test";
import { blinks, drift } from "../support/frames.ts";
import { observe } from "../support/observe.ts";
import { wakeStage } from "../support/open.ts";
import { boxOf, inside } from "../support/geometry.ts";
import { pxOf, SIZE } from "../support/looks.ts";
import { pointAway, restOn } from "../support/pointer.ts";
import { control, pictureOf, shownTip, stageOf } from "../support/stage.ts";
import { HOVER_REST_MS, OPEN_DELAY_MS, TIP_REST_MS, untilStill } from "../support/timing.ts";
import { startTracking } from "../support/track.ts";
import { middleY, openMyStream, shownIcons } from "./controls.ts";

const ROW = ["Stop sharing your screen", "Turn on your camera", "Share your voice", "Settings"];

/** My camera on as well, then the pointer off my row, the controls awake. */
async function cameraOn(page: Page) {
  await control(page, "Turn on your camera").click();
  await stageOf(page).getByLabel("Your camera", { exact: true }).first().waitFor();
  await untilStill(page);
  await wakeStage(page);
}

/** Whether a drop-up holds no focus or clicks: rolled up. */
const rolledUp = (up: Locator) => up.evaluate((el) => (el as HTMLElement).inert);

test("F-my-buttons.1 my own row: screen, camera, mic and settings, L 48, centred on my picture", async ({
  page,
}, info) => {
  await openMyStream(page);
  const [screen, camera, mic, cog] = ROW.map((n) => control(page, n));
  const full = control(page, "Fullscreen");
  const seen = await observe(page, info, { screen: screen!, cog: cog! }, () => wakeStage(page));
  const large = await pxOf(page, SIZE.buttonL);
  for (const b of [screen!, camera!, mic!, cog!]) {
    await expect.soft(b).toBeVisible();
    const box = await boxOf(b);
    expect.soft(Math.round(box.width)).toBe(large);
    expect.soft(inside(box, await boxOf(pictureOf(page)))).toBe(true);
    expect.soft(Math.abs((await middleY(b)) - (await middleY(full)))).toBeLessThan(1);
  }
  await expect.soft(screen!).toHaveAttribute("aria-pressed", "true");
  await expect.soft(camera!).toHaveAttribute("aria-pressed", "false");
  expect.soft(await shownIcons(screen!)).toEqual(["screen-on"]);
  expect.soft(await shownIcons(camera!)).toEqual(["camera-off"]);
  expect.soft(await shownIcons(cog!)).toEqual(["cog"]);
  // In order, centred on the picture.
  const s = await boxOf(screen!);
  const c = await boxOf(cog!);
  const p = await boxOf(pictureOf(page));
  expect.soft(Math.abs((s.x + c.x + c.width) / 2 - (p.x + p.width / 2))).toBeLessThan(2);
  // Over my own stream, nothing of the viewer bar.
  await expect.soft(control(page, "Go live")).toHaveCount(0);
  expect.soft(seen.after.cog?.visible).toBe(true);
});

test("F-my-buttons.2 my live screen keeps its icon while pointed at", async ({ page }, info) => {
  await openMyStream(page);
  const screen = control(page, "Stop sharing your screen");
  const icon = screen.locator("svg").first();
  const seen = await observe(page, info, { screen, icon }, async () => {
    await restOn(page, screen, HOVER_REST_MS);
  });
  // Live: the plain monitor, at rest and pointed at.
  expect.soft(await shownIcons(screen)).toEqual(["screen-on"]);
  expect.soft(seen.after.icon?.visible).toBe(true);
  expect.soft(blinks(seen.frames, "screen")).toEqual([]);
  expect.soft(drift(seen.frames, "screen")).toBeLessThan(1);
});

test("F-my-buttons.3 my camera keeps its icon while pointed at, off or on", async ({ page }, info) => {
  await openMyStream(page);
  const camera = control(page, /your camera/);
  const icon = camera.locator("svg").first();
  const seen = await observe(page, info, { camera, icon }, async () => {
    await restOn(page, camera, HOVER_REST_MS);
  });
  // Off: the crossed camera, pointed at too.
  expect.soft(await shownIcons(camera)).toEqual(["camera-off"]);
  expect.soft(seen.after.icon?.visible).toBe(true);
  expect.soft(drift(seen.frames, "camera")).toBeLessThan(1);
  expect.soft(blinks(seen.frames, "camera")).toEqual([]);
  await wakeStage(page);
  await cameraOn(page);
  // On, then pointed at: watched on every frame too.
  const stop = await startTracking(page, { camera, icon });
  await restOn(page, camera, HOVER_REST_MS);
  await untilStill(page);
  const on = await stop();
  // On: the plain camera, pointed at too.
  await expect.soft(camera).toHaveAccessibleName("Turn off your camera");
  expect.soft(await shownIcons(camera)).toEqual(["camera-on"]);
  expect.soft(on.at(-1)?.seen.icon?.visible).toBe(true);
  expect.soft(drift(on, "camera")).toBeLessThan(1);
  expect.soft(blinks(on, "camera")).toEqual([]);
  expect.soft(blinks(on, "icon")).toEqual([]);
});

test("F-my-buttons.4 my screen, off, shows its crossed monitor at rest and share while pointed at", async ({
  page,
}, info) => {
  await openMyStream(page);
  await cameraOn(page);
  await control(page, "Stop sharing your screen").click();
  await control(page, "Share your screen").waitFor({ state: "attached" });
  await untilStill(page);
  await pointAway(page);
  await wakeStage(page);
  const screen = control(page, "Share your screen");
  await expect.soft(screen).toHaveAttribute("aria-pressed", "false");
  expect.soft(await shownIcons(screen)).toEqual(["screen-off"]);
  const seen = await observe(page, info, { screen }, async () => {
    await restOn(page, screen, TIP_REST_MS);
    await shownTip(page).waitFor();
  });
  expect.soft(await shownIcons(screen)).toEqual(["screen-share"]);
  await expect.soft(shownTip(page)).toHaveText("Share your screen");
  expect.soft(blinks(seen.frames, "screen")).toEqual([]);
  expect.soft(drift(seen.frames, "screen")).toBeLessThan(1);
});

test("F-my-buttons.5 resting on my live screen unrolls what's shared and Change", async ({ page }, info) => {
  await openMyStream(page);
  const screen = control(page, "Stop sharing your screen");
  const up = page.locator('fieldset[aria-label="What you share"]');
  expect.soft(await rolledUp(up)).toBe(true);
  const seen = await observe(page, info, { screen, up }, async () => {
    await restOn(page, screen, OPEN_DELAY_MS);
    await expect.poll(() => rolledUp(up)).toBe(false);
  });
  expect.soft(await rolledUp(up)).toBe(false);
  await expect.soft(up).toBeVisible();
  await expect.soft(up).toContainText("Your screen");
  await expect.soft(up.getByRole("button", { name: "Change" })).toBeVisible();
  // Above its button, and no tooltip: the drop-up takes its place.
  const u = await boxOf(up);
  const s = await boxOf(screen);
  expect.soft(u.y + u.height).toBeLessThanOrEqual(s.y);
  await expect.soft(shownTip(page)).toHaveCount(0);
  expect.soft(drift(seen.frames, "screen")).toBeLessThan(1);
});

test("F-my-buttons.6 resting on my live camera unrolls its camera picker", async ({ page }, info) => {
  await openMyStream(page);
  await cameraOn(page);
  const camera = control(page, "Turn off your camera");
  const up = page.locator('fieldset[aria-label="Your camera"]');
  const seen = await observe(page, info, { camera, up }, async () => {
    await restOn(page, camera, OPEN_DELAY_MS);
    await expect.poll(() => rolledUp(up)).toBe(false);
  });
  expect.soft(await rolledUp(up)).toBe(false);
  await expect.soft(up).toBeVisible();
  await expect.soft(up.getByRole("button", { name: /^Camera:/ })).toBeVisible();
  const u = await boxOf(up);
  const c = await boxOf(camera);
  expect.soft(u.y + u.height).toBeLessThanOrEqual(c.y);
  expect.soft(drift(seen.frames, "camera")).toBeLessThan(1);
});

test("F-my-buttons.7 turning on my camera keeps the button under the pointer still", async ({ page }, info) => {
  await openMyStream(page);
  const camera = control(page, /your camera/);
  await restOn(page, camera, HOVER_REST_MS);
  await untilStill(page);
  const seen = await observe(page, info, { camera }, async () => {
    await page.mouse.down();
    await page.mouse.up();
    await expect(camera).toHaveAccessibleName("Turn off your camera");
    await stageOf(page).getByLabel("Your camera", { exact: true }).first().waitFor();
  });
  await expect.soft(camera).toHaveAccessibleName("Turn off your camera");
  await expect.soft(camera).toHaveAttribute("aria-pressed", "true");
  expect.soft(drift(seen.frames, "camera")).toBeLessThan(1);
  expect.soft(blinks(seen.frames, "camera")).toEqual([]);
});

test("F-my-buttons.8 the cog opens the settings just above my row", async ({ page }, info) => {
  await openMyStream(page);
  const cog = control(page, "Settings");
  const dialog = page.getByRole("dialog", { name: "Settings" });
  await expect.soft(cog).toHaveAttribute("aria-expanded", "false");
  const seen = await observe(page, info, { cog, dialog }, async () => {
    await cog.click();
    await dialog.waitFor();
  });
  await expect.soft(dialog).toBeVisible();
  await expect.soft(cog).toHaveAttribute("aria-expanded", "true");
  const d = await boxOf(dialog);
  const c = await boxOf(cog);
  expect.soft(d.y + d.height).toBeLessThanOrEqual(c.y);
  // Centred on the cog, unless that would take it past the picture's edge: then kept inside.
  const pic = await boxOf(pictureOf(page));
  const centred = Math.abs(d.x + d.width / 2 - (c.x + c.width / 2)) < 2;
  const heldIn =
    d.x >= pic.x && d.x + d.width <= pic.x + pic.width && (d.x - pic.x < 16 || pic.x + pic.width - d.x - d.width < 16);
  expect.soft(centred || heldIn).toBe(true);
  await expect.soft(dialog).toBeInViewport({ ratio: 1 });
  expect.soft(drift(seen.frames, "cog")).toBeLessThan(1);
  expect.soft(blinks(seen.frames, "cog")).toEqual([]);
});

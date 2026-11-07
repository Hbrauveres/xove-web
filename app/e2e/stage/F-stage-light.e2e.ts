import { expect, test, type Page } from "@playwright/test";
import { blinks } from "../support/frames.ts";
import { observe } from "../support/observe.ts";
import { openScene, wakeStage } from "../support/open.ts";
import { boxOf, centreX, centreY, restOnStage, stageOf, type Box } from "./stage.ts";

/** The ambilight as last chosen in the settings, before the page opens. */
const chosen = (page: Page, on: boolean, brightness: number) =>
  page.addInitScript(
    ([on, brightness]) => {
      localStorage.setItem("xove.ambilight.on", String(on));
      localStorage.setItem("xove.ambilight.brightness", String(brightness));
    },
    [on, brightness] as const,
  );

/** The stream's light: a canvas behind the picture. */
const streamLight = (page: Page) => stageOf(page).view.locator('canvas[class*="_light_"]');
/** The empty stage's two lights on the wall: its corners' and its static's. */
const wallLights = (page: Page) => stageOf(page).view.locator(':scope > span[class*="_glow_"]');

/** Whether `outer` reaches past `inner` on every side. */
const reachesPast = (outer: Box, inner: Box) =>
  outer.x < inner.x &&
  outer.y < inner.y &&
  outer.x + outer.width > inner.x + inner.width &&
  outer.y + outer.height > inner.y + inner.height;

test("F-stage-light.1 a stream lights the wall round the picture, past every edge", async ({ page }, info) => {
  await openScene(page, "s=live");
  const light = streamLight(page);
  await observe(page, info, { light }, () => wakeStage(page));
  await expect.soft(light).toHaveCount(1);
  await expect.soft(light).toHaveAttribute("data-on", "true");
  await expect.soft(light).toHaveAttribute("aria-hidden", "true");
  expect.soft(await light.evaluate((c) => Number(getComputedStyle(c).opacity))).toBeCloseTo(0.9, 2);
  expect.soft(reachesPast(await boxOf(light), await boxOf(stageOf(page).view))).toBe(true);
});

test("F-stage-light.2 the light takes a tall picture's shape, centred on it, and takes no clicks", async ({
  page,
}, info) => {
  await openScene(page, "s=portrait");
  const light = streamLight(page);
  await observe(page, info, { light }, () => wakeStage(page));
  const l = await boxOf(light);
  const view = await boxOf(stageOf(page).view);
  expect.soft(reachesPast(l, view)).toBe(true);
  expect.soft(l.height).toBeGreaterThan(l.width);
  expect.soft(Math.abs(centreX(l) - centreX(view))).toBeLessThan(2);
  expect.soft(Math.abs(centreY(l) - centreY(view))).toBeLessThan(2);
  // On the dark beside the picture, the pointer reaches the stage, not the light.
  const hit = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.tagName ?? "", {
    x: view.x - 20,
    y: centreY(view),
  });
  expect.soft(hit).not.toBe("CANVAS");
});

test("F-stage-light.3 switched off in the settings, a stream has no light", async ({ page }, info) => {
  await chosen(page, false, 0.9);
  await openScene(page, "s=live");
  const light = streamLight(page);
  await observe(page, info, { light }, () => wakeStage(page));
  await expect.soft(light).not.toHaveAttribute("data-on", /.*/);
  expect.soft(await light.evaluate((c) => Number(getComputedStyle(c).opacity))).toBe(0);
});

test("F-stage-light.4 the light shines at the brightness chosen in the settings", async ({ page }, info) => {
  await chosen(page, true, 0.4);
  await openScene(page, "s=live");
  const light = streamLight(page);
  await observe(page, info, { light }, () => wakeStage(page));
  expect.soft(await light.evaluate((c) => Number(getComputedStyle(c).opacity))).toBeCloseTo(0.4, 2);
});

test("F-stage-light.5 nobody live: the corners and the static light the wall instead", async ({ page }, info) => {
  await openScene(page, "s=empty");
  const lights = wallLights(page);
  await observe(page, info, { lights }, () => wakeStage(page));
  await expect.soft(streamLight(page)).toHaveCount(0);
  await expect.soft(lights).toHaveCount(2);
  const opacities = await lights.evaluateAll((els) => els.map((e) => Number(getComputedStyle(e).opacity)));
  expect.soft(opacities.map((o) => Math.round(o * 100) / 100)).toEqual([0.9, 0.9]);
  // The static's light reaches past the stage's edges.
  const glow = await boxOf(stageOf(page).view.locator(':scope > span[class*="_glow_"] canvas'));
  expect.soft(reachesPast(glow, await boxOf(stageOf(page).view))).toBe(true);
});

test("F-stage-light.6 nobody live with the light switched off: the wall stays dark", async ({ page }, info) => {
  await chosen(page, false, 0.9);
  await openScene(page, "s=empty");
  const lights = wallLights(page);
  await observe(page, info, { lights }, () => wakeStage(page));
  expect.soft(await lights.evaluateAll((els) => els.map((e) => Number(getComputedStyle(e).opacity)))).toEqual([0, 0]);
});

test("F-stage-light.7 the light never blinks while the controls fade", async ({ page }, info) => {
  await openScene(page, "s=live");
  await wakeStage(page);
  const light = streamLight(page);
  const seen = await observe(page, info, { light, frame: stageOf(page).frame }, () => restOnStage(page), {
    settle: 200,
  });
  await expect.soft(stageOf(page).frame).toHaveAttribute("data-chrome", "hidden");
  expect.soft(blinks(seen.frames, "light")).toEqual([]);
  expect.soft(await light.evaluate((c) => Number(getComputedStyle(c).opacity))).toBeCloseTo(0.9, 2);
});

import { expect, test, type Page } from "@playwright/test";
import { blinks, drift } from "../support/frames.ts";
import { observe } from "../support/observe.ts";
import { openScene, wakeStage } from "../support/open.ts";
import { boxOf, centreY, inside } from "../support/geometry.ts";
import { setShape } from "../support/harness.ts";
import { pointAt } from "../support/pointer.ts";
import { stageOf } from "../support/stage.ts";
import { untilStill } from "../support/timing.ts";
import { reshape, shownControls, stageParts } from "./stage.ts";

/** Pictures' shapes (width ÷ height): narrow, narrower than a phone held up, and nearly square. */
const NARROW = 0.3;
const TALLISH = 0.45;
const SQUARISH = 1.2;

/** The names of the shown controls lying outside the picture. */
async function outsideThePicture(page: Page): Promise<string[]> {
  const view = await boxOf(stageParts(page).view);
  return (await shownControls(page)).filter((c) => !inside(c.box, view)).map((c) => c.name);
}

test("F-picture-layer.1 over a wide stream, every control sits inside the picture", async ({ page }, info) => {
  await openScene(page, "s=live");
  const stage = stageParts(page);
  const fullscreen = page.getByRole("button", { name: "Fullscreen" });
  const goLive = page.getByRole("button", { name: "Go live" });
  await observe(page, info, { view: stage.view, fullscreen, goLive }, () => wakeStage(page));
  await wakeStage(page);
  const shown = await shownControls(page);
  expect.soft(shown.map((c) => c.name)).toEqual(expect.arrayContaining(["Fullscreen", "Go live"]));
  expect.soft(await outsideThePicture(page)).toEqual([]);
});

test("F-picture-layer.2 over a tall picture, the controls sit on the picture, never on the dark sides", async ({
  page,
}, info) => {
  await openScene(page, "s=portrait");
  const stage = stageParts(page);
  const fullscreen = page.getByRole("button", { name: "Fullscreen" });
  await observe(page, info, { view: stage.view, layer: stage.layer, fullscreen }, () => wakeStage(page));
  await wakeStage(page);
  const view = await boxOf(stage.view);
  const layer = await boxOf(stage.layer);
  const box = await boxOf(stage.box);
  // Narrower than the box (on a monitor on its side, only a little).
  expect.soft(view.width).toBeLessThan(box.width - 2);
  expect.soft(Math.abs(layer.x - view.x) + Math.abs(layer.width - view.width)).toBeLessThan(1);
  expect.soft((await shownControls(page)).length).toBeGreaterThan(1);
  expect.soft(await outsideThePicture(page)).toEqual([]);
});

test("F-picture-layer.3 on a narrow picture, every control still sits inside it", async ({ page }, info) => {
  await openScene(page, "s=live");
  const stage = stageParts(page);
  const fullscreen = page.getByRole("button", { name: "Fullscreen" });
  await observe(page, info, { view: stage.view, fullscreen }, () => reshape(page, NARROW));
  await wakeStage(page);
  expect.soft((await shownControls(page)).length).toBeGreaterThan(1);
  expect.soft(await outsideThePicture(page)).toEqual([]);
});

test("F-picture-layer.4 the fullscreen button sits at the picture's bottom right, level with the round buttons", async ({
  page,
}, info) => {
  await openScene(page, "s=live");
  const stage = stageParts(page);
  const fullscreen = page.getByRole("button", { name: "Fullscreen" });
  const goLive = page.getByRole("button", { name: "Go live" });
  await observe(page, info, { fullscreen, goLive }, () => wakeStage(page));
  const view = await boxOf(stage.view);
  const f = await boxOf(fullscreen);
  const g = await boxOf(goLive);
  expect.soft(inside(f, view)).toBe(true);
  // In the bottom-right corner: close to the picture's right edge and to its bottom.
  expect.soft(view.x + view.width - (f.x + f.width)).toBeLessThanOrEqual(16);
  expect.soft(view.y + view.height - (f.y + f.height)).toBeLessThanOrEqual(32);
  expect.soft(Math.abs(centreY(f) - centreY(g))).toBeLessThanOrEqual(1);
  expect.soft(f.x).toBeGreaterThan(g.x + g.width);
});

test("F-picture-layer.5 on the empty stage, fullscreen and settings sit level in the bottom-right corner", async ({
  page,
}, info) => {
  await openScene(page, "s=empty");
  const stage = stageParts(page);
  const fullscreen = page.getByRole("button", { name: "Fullscreen" });
  const settings = page.getByRole("button", { name: "Settings" });
  await observe(page, info, { fullscreen, settings }, () => wakeStage(page));
  const view = await boxOf(stage.view);
  const f = await boxOf(fullscreen);
  const s = await boxOf(settings);
  await expect.soft(fullscreen).toBeVisible();
  await expect.soft(settings).toBeVisible();
  expect.soft(inside(f, view) && inside(s, view)).toBe(true);
  expect.soft(Math.abs(centreY(f) - centreY(s))).toBeLessThanOrEqual(1);
  expect.soft(f.x).toBeGreaterThan(s.x);
  expect.soft(f.x).toBeGreaterThan(view.x + view.width * 0.75);
  expect.soft(f.y).toBeGreaterThan(view.y + view.height * 0.75);
});

test("F-picture-layer.6 a picture changing shape: the controls glide with its edges on every frame", async ({
  page,
}, info) => {
  await openScene(page, "s=live");
  await reshape(page, TALLISH);
  const stage = stageParts(page);
  const fullscreen = page.getByRole("button", { name: "Fullscreen" });
  const seen = await observe(page, info, { view: stage.view, layer: stage.layer, fullscreen }, async () => {
    await setShape(page, SQUARISH);
    await untilStill(stageOf(page));
  });
  const apart = Math.max(
    ...seen.frames.map((f) => {
      const v = f.seen.view?.box;
      const l = f.seen.layer?.box;
      if (!v || !l) return 0;
      return Math.max(Math.abs(v.x - l.x), Math.abs(v.y - l.y), Math.abs(v.w - l.w), Math.abs(v.h - l.h));
    }),
  );
  expect.soft(apart).toBeLessThan(1);
  const widths = seen.frames.map((f) => f.seen.layer?.box?.w ?? 0);
  const first = widths[0] ?? 0;
  const last = widths.at(-1) ?? 0;
  expect.soft(widths.filter((w) => w > first + 5 && w < last - 5).length).toBeGreaterThanOrEqual(3);
  expect.soft(blinks(seen.frames, "fullscreen")).toEqual([]);
  await wakeStage(page);
  expect.soft(await outsideThePicture(page)).toEqual([]);
});

test("F-picture-layer.7 with reduced motion, the controls jump with the picture at once", async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openScene(page, "s=live");
  await reshape(page, TALLISH);
  const stage = stageParts(page);
  const first = (await boxOf(stage.layer)).width;
  const seen = await observe(page, info, { view: stage.view, layer: stage.layer }, async () => {
    await setShape(page, SQUARISH);
    await untilStill(stageOf(page));
  });
  const last = (await boxOf(stage.layer)).width;
  const widths = seen.frames.map((f) => f.seen.layer?.box?.w ?? 0);
  expect.soft(last).toBeGreaterThan(first + 50);
  // No frame in between: the old width, then the new one.
  expect.soft(widths.filter((w) => w > first + 1 && w < last - 1)).toEqual([]);
});

test("F-picture-layer.8 pointing at a control moves nothing on the picture's layer", async ({ page }, info) => {
  await openScene(page, "s=live");
  await wakeStage(page);
  const fullscreen = page.getByRole("button", { name: "Fullscreen" });
  const goLive = page.getByRole("button", { name: "Go live" });
  const stage = stageParts(page);
  const seen = await observe(page, info, { layer: stage.layer, fullscreen, goLive }, () => pointAt(page, fullscreen));
  for (const name of ["layer", "fullscreen", "goLive"]) {
    expect.soft(drift(seen.frames, name), name).toBeLessThan(1);
    expect.soft(blinks(seen.frames, name), name).toEqual([]);
  }
});

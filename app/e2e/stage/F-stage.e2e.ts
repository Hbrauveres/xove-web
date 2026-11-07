import { expect, test } from "@playwright/test";
import { blinks } from "../support/frames.ts";
import { observe } from "../support/observe.ts";
import { openScene, wakeStage } from "../support/open.ts";
import { boxOf, centreX, inside, windowBox } from "../support/geometry.ts";
import { everyoneStops, setShape } from "../support/harness.ts";
import { stageOf } from "../support/stage.ts";
import { untilStill } from "../support/timing.ts";
import { stageParts, TALL, WIDE } from "./stage.ts";

/** A picture's shape between wide and tall (width ÷ height). */
const SQUARISH = 1.2;

test("F-stage.1 a wide picture fills the stage's box, with no black bars", async ({ page }, info) => {
  await openScene(page, "s=live");
  const stage = stageParts(page);
  const video = stage.box.getByLabel("Marina's shared screen");
  await observe(page, info, { box: stage.box, view: stage.view, video }, () => wakeStage(page));
  const box = await boxOf(stage.box);
  const view = await boxOf(stage.view);
  await expect.soft(video).toBeVisible();
  expect.soft(Math.abs(view.width - box.width)).toBeLessThan(1);
  expect.soft(Math.abs(view.height - box.height)).toBeLessThan(1);
  expect.soft(Math.abs(view.width / view.height / WIDE - 1)).toBeLessThan(0.01);
  // The picture covers its box: no black shows at an edge.
  await expect.soft(video).toHaveAttribute("data-fill", "true");
  expect.soft(inside(box, windowBox(page))).toBe(true);
});

test("F-stage.2 a tall picture keeps the box's width, the picture narrower and centred in it", async ({
  page,
}, info) => {
  await openScene(page, "s=portrait");
  const stage = stageParts(page);
  const video = stage.box.getByLabel("Matheus's camera");
  await observe(page, info, { box: stage.box, view: stage.view, video }, () => wakeStage(page));
  const box = await boxOf(stage.box);
  const view = await boxOf(stage.view);
  const column = await boxOf(stage.region);
  await expect.soft(video).toBeVisible();
  expect.soft(Math.abs(box.width - column.width)).toBeLessThan(1);
  expect.soft(Math.abs(view.height - box.height)).toBeLessThan(1);
  // Narrower than the box (on a monitor on its side, only a little).
  expect.soft(view.width).toBeLessThan(box.width - 2);
  expect.soft(Math.abs(centreX(view) - centreX(box))).toBeLessThan(1);
  expect.soft(Math.abs(view.width / view.height - TALL)).toBeLessThan(0.01);
});

test("F-stage.3 a picture changing shape: the stage glides to it, without a jump or a blink", async ({
  page,
}, info) => {
  await openScene(page, "s=live");
  await wakeStage(page);
  const stage = stageParts(page);
  const start = await boxOf(stage.view);
  const seen = await observe(page, info, { view: stage.view }, async () => {
    await setShape(page, SQUARISH);
    await untilStill(stageOf(page));
  });
  const end = await boxOf(stage.view);
  expect.soft(Math.abs(end.width / end.height - SQUARISH)).toBeLessThan(0.01);
  // It narrows on a wide screen and grows taller on a monitor on its side: whichever changes, it
  // passes through sizes in between.
  const narrower = start.width - end.width;
  const taller = end.height - start.height;
  expect.soft(Math.max(narrower, taller)).toBeGreaterThan(50);
  const [from, to, side] =
    narrower > taller ? ([start.width, end.width, "w"] as const) : ([start.height, end.height, "h"] as const);
  const sizes = seen.frames.map((f) => f.seen.view?.box?.[side] ?? 0);
  const between = sizes.filter((v) => v > Math.min(from, to) + 5 && v < Math.max(from, to) - 5).length;
  expect.soft(between).toBeGreaterThanOrEqual(3);
  expect.soft(blinks(seen.frames, "view")).toEqual([]);
});

test("F-stage.4 the person sharing the longest is on the stage at first", async ({ page }, info) => {
  await openScene(page, "s=live");
  const stage = stageParts(page);
  const marina = stage.box.getByLabel("Marina's shared screen");
  await observe(page, info, { marina }, () => wakeStage(page));
  await expect.soft(marina).toBeVisible();
  await expect.soft(stage.box.getByLabel("Rafa's shared screen")).toHaveCount(0);
  await expect.soft(stage.box.getByLabel("Ana's camera")).toHaveCount(0);
  await expect.soft(stage.box.locator("video")).toHaveCount(1);
});

test("F-stage.5 watching another stream puts it on the stage, in Marina's place", async ({ page }, info) => {
  await openScene(page, "s=live");
  const stage = stageParts(page);
  const rafa = stage.box.getByLabel("Rafa's shared screen");
  await observe(page, info, { rafa, view: stage.view }, async () => {
    await page.getByRole("button", { name: "Watch Rafa · screen" }).click();
    await rafa.waitFor();
  });
  await expect.soft(rafa).toBeVisible();
  await expect.soft(stage.box.getByLabel("Marina's shared screen")).toHaveCount(0);
  await expect.soft(stage.box.locator("video")).toHaveCount(1);
});

test("F-stage.6 when everyone stops, the stage goes back to 16:9, as wide as its box", async ({ page }, info) => {
  await openScene(page, "s=portrait");
  const stage = stageParts(page);
  await observe(page, info, { view: stage.view, box: stage.box }, async () => {
    await everyoneStops(page);
    await page.getByRole("heading", { name: "Go live" }).waitFor();
  });
  const box = await boxOf(stage.box);
  const view = await boxOf(stage.view);
  await expect.soft(stage.box.locator("video")).toHaveCount(0);
  expect.soft(Math.abs(view.width / view.height / WIDE - 1)).toBeLessThan(0.01);
  expect.soft(Math.abs(view.width - box.width)).toBeLessThan(1);
});

test("F-stage.7 my own stream plays on my stage, without its sound", async ({ page }, info) => {
  await openScene(page, "s=empty");
  const stage = stageParts(page);
  const mine = stage.box.getByLabel("Your shared screen");
  await observe(page, info, { mine, view: stage.view }, async () => {
    await page.getByRole("button", { name: "Share your screen" }).click();
    await mine.waitFor();
  });
  await expect.soft(mine).toBeVisible();
  expect.soft(await mine.evaluate((v: HTMLVideoElement) => v.muted)).toBe(true);
  await expect.soft(stage.box.locator("audio")).toHaveCount(0);
});

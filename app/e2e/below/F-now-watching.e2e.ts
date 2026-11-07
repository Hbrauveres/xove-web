import { expect, test } from "@playwright/test";
import { blinks, drift } from "../support/frames.ts";
import { observe } from "../support/observe.ts";
import { FIXED_TIME, openScene } from "../support/open.ts";
import { boxOf, pictureOf, pointAt } from "./below.ts";

/** The line under the name: LIVE, what, how long, who's watching. */
const metaOf = (page: import("@playwright/test").Page) => page.getByRole("paragraph").filter({ hasText: "LIVE" });

test("F-now-watching.1 who's on the stage: name, LIVE, what, how long and how many watch", async ({ page }, info) => {
  await openScene(page, "s=live");
  const name = page.getByRole("heading", { name: "Marina", level: 2 });
  const meta = metaOf(page);
  const seen = await observe(page, info, { name, meta }, async () => {
    await page.mouse.move(10, 10);
  });
  await expect.soft(name).toBeVisible();
  await expect.soft(meta).toHaveText("LIVEScreen1:12:403 watching");
  await expect.soft(meta.getByText("LIVE", { exact: true })).toBeVisible();
  // Under the picture, inside the window, starting at its left.
  const pic = await boxOf(pictureOf(page));
  const n = await boxOf(name);
  expect.soft(n.y).toBeGreaterThanOrEqual(pic.y + pic.height);
  expect.soft(n.x).toBeGreaterThanOrEqual(pic.x - 0.5);
  expect.soft(n.x).toBeLessThan(pic.x + pic.width / 2);
  await expect.soft(meta).toBeInViewport({ ratio: 1 });
  expect.soft(blinks(seen.frames, "name")).toEqual([]);
});

test("F-now-watching.2 the duration counts up, nothing beside it moving", async ({ page }, info) => {
  await openScene(page, "s=live");
  const name = page.getByRole("heading", { name: "Marina", level: 2 });
  const meta = metaOf(page);
  const live = meta.getByText("LIVE", { exact: true });
  const seen = await observe(page, info, { name, live, meta }, async () => {
    await page.clock.setFixedTime(new Date(FIXED_TIME.getTime() + 65_000));
    await page.waitForTimeout(1200);
  });
  await expect.soft(meta).toContainText("1:13:45");
  expect.soft(drift(seen.frames, "name")).toBeLessThan(1);
  expect.soft(drift(seen.frames, "live")).toBeLessThan(1);
  expect.soft(blinks(seen.frames, "meta")).toEqual([]);
});

test("F-now-watching.3 pointing at who's watching names them", async ({ page }, info) => {
  await openScene(page, "s=live");
  const watching = page.getByText("3 watching");
  const tip = page.getByRole("tooltip");
  await observe(page, info, { watching, tip }, async () => {
    await pointAt(page, watching);
    await page.waitForTimeout(400);
  });
  await expect.soft(tip).toHaveText("Henrique, Rafa, Ana");
  // The sharer isn't among them.
  await expect.soft(tip).not.toContainText("Marina");
});

test("F-now-watching.4 what they share, in words", async ({ page }, info) => {
  await openScene(page, "s=facecam");
  const meta = metaOf(page);
  await observe(page, info, { meta }, async () => {
    await page.mouse.move(10, 10);
  });
  await expect.soft(meta).toContainText("Screen with camera");
  await openScene(page, "s=live");
  await page.getByRole("button", { name: "Watch Ana · camera" }).click();
  await page.waitForTimeout(1500);
  await expect.soft(page.getByRole("heading", { name: "Ana", level: 2 })).toBeVisible();
  await expect.soft(metaOf(page)).toContainText(/^LIVECamera1:35/);
});

test("F-now-watching.5 another stream on the stage changes the row to its sharer", async ({ page }, info) => {
  await openScene(page, "s=live");
  const meta = metaOf(page);
  const seen = await observe(page, info, { meta, heading: page.getByRole("heading", { level: 2 }) }, async () => {
    await page.getByRole("button", { name: "Watch Rafa · screen" }).click();
    await page.waitForTimeout(1500);
  });
  await expect.soft(page.getByRole("heading", { name: "Rafa", level: 2 })).toBeVisible();
  await expect.soft(page.getByRole("heading", { name: "Marina", level: 2 })).toHaveCount(0);
  await expect.soft(meta).toHaveText("LIVEScreen38:051 watching");
  expect.soft(drift(seen.frames, "heading")).toBeLessThan(1);
});

test("F-now-watching.6 with nobody live it says so, and who's here", async ({ page }, info) => {
  await openScene(page, "s=live");
  const empty = page.getByRole("heading", { name: "Nobody is sharing yet", level: 2 });
  await observe(page, info, { empty }, async () => {
    await page.evaluate(() => (window as unknown as { __xove: { everyoneStops: () => void } }).__xove.everyoneStops());
    await page.waitForTimeout(2500);
  });
  await expect.soft(empty).toBeVisible();
  await expect.soft(page.getByText("Marina, Rafa and Ana are here.")).toBeVisible();
  await expect.soft(page.getByText("LIVE", { exact: true })).toHaveCount(0);
  await expect.soft(page.getByText(/watching/)).toHaveCount(0);
});

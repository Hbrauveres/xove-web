import { expect, test } from "@playwright/test";
import { blinks, drift } from "../support/frames.ts";
import { observe } from "../support/observe.ts";
import { openScene, wakeStage } from "../support/open.ts";
import { boxOf, centreX, centreY, restOnStage, seenOpacity, stageOf } from "./stage.ts";

test("F-stage-fade.1 over a playing stream, the controls fade 2.5 s after the mouse stops", async ({ page }, info) => {
  await openScene(page, "s=live");
  const stage = stageOf(page);
  const goLive = page.getByRole("button", { name: "Go live" });
  const fullscreen = page.getByRole("button", { name: "Fullscreen" });
  const b = await boxOf(stage.box);
  // The mouse comes to rest on the stage, away from its controls.
  await page.mouse.move(centreX(b), b.y + b.height * 0.3);
  await page.mouse.move(centreX(b) + 4, b.y + b.height * 0.3 + 2);
  const restedAt = Date.now();
  await page.waitForTimeout(1500);
  await expect.soft(stage.frame).toHaveAttribute("data-chrome", "shown");
  expect.soft(await seenOpacity(goLive)).toBe(1);
  const seen = await observe(page, info, { goLive, fullscreen }, async () => {
    await page.waitForTimeout(Math.max(0, restedAt + 3000 - Date.now()));
  });
  await expect.soft(stage.frame).toHaveAttribute("data-chrome", "hidden");
  expect.soft(await seenOpacity(goLive)).toBe(0);
  expect.soft(await seenOpacity(fullscreen)).toBe(0);
  // The pointer hides with them.
  expect.soft(await stage.frame.evaluate((f) => getComputedStyle(f).cursor)).toBe("none");
  // They fade where they are.
  expect.soft(drift(seen.frames, "goLive")).toBeLessThan(1);
  expect.soft(drift(seen.frames, "fullscreen")).toBeLessThan(1);
});

test("F-stage-fade.2 a mouse move brings them back, where they were, without a blink", async ({ page }, info) => {
  await openScene(page, "s=live");
  await wakeStage(page);
  const goLive = page.getByRole("button", { name: "Go live" });
  const fullscreen = page.getByRole("button", { name: "Fullscreen" });
  const before = await boxOf(goLive);
  await restOnStage(page);
  // Read right after the move: the controls fade again 2.5 s later.
  let chrome: string | null = null;
  let opacity = 0;
  let after = before;
  const seen = await observe(page, info, { goLive, fullscreen }, async () => {
    await page.mouse.move(centreX(before), before.y - 120, { steps: 3 });
    await page.waitForTimeout(300);
    chrome = await stageOf(page).frame.getAttribute("data-chrome");
    opacity = await seenOpacity(goLive);
    after = await boxOf(goLive);
  });
  expect.soft(chrome).toBe("shown");
  expect.soft(opacity).toBe(1);
  expect.soft(Math.abs(after.x - before.x) + Math.abs(after.y - before.y)).toBeLessThan(1);
  expect.soft(drift(seen.frames, "goLive")).toBeLessThan(1);
  expect.soft(blinks(seen.frames, "fullscreen")).toEqual([]);
});

test("F-stage-fade.3 a move on the dark beside a tall picture brings them back too", async ({ page }, info) => {
  await openScene(page, "s=portrait");
  await wakeStage(page);
  await restOnStage(page);
  const stage = stageOf(page);
  const fullscreen = page.getByRole("button", { name: "Fullscreen" });
  await expect.soft(stage.frame).toHaveAttribute("data-chrome", "hidden");
  const view = await boxOf(stage.view);
  // Read right after the move: the controls fade again 2.5 s later.
  let chrome: string | null = null;
  let opacity = 0;
  await observe(page, info, { fullscreen }, async () => {
    await page.mouse.move(view.x - 60, centreY(view), { steps: 3 });
    await page.waitForTimeout(300);
    chrome = await stage.frame.getAttribute("data-chrome");
    opacity = await seenOpacity(fullscreen);
  });
  expect.soft(chrome).toBe("shown");
  expect.soft(opacity).toBe(1);
});

test("F-stage-fade.4 leaving the stage hides them at once", async ({ page }, info) => {
  await openScene(page, "s=live");
  await wakeStage(page);
  const goLive = page.getByRole("button", { name: "Go live" });
  const seen = await observe(
    page,
    info,
    { goLive },
    async () => {
      await page.mouse.move(4, 4, { steps: 2 });
    },
    { settle: 400 },
  );
  await expect.soft(stageOf(page).frame).toHaveAttribute("data-chrome", "hidden");
  expect.soft(await seenOpacity(goLive)).toBe(0);
  expect.soft(drift(seen.frames, "goLive")).toBeLessThan(1);
});

test("F-stage-fade.5 a click where a faded control was only brings the controls back", async ({ page }, info) => {
  await openScene(page, "s=live");
  await wakeStage(page);
  const goLive = page.getByRole("button", { name: "Go live" });
  const g = await boxOf(goLive);
  await page.mouse.move(centreX(g), g.y - 150);
  await page.waitForTimeout(3200);
  await expect.soft(stageOf(page).frame).toHaveAttribute("data-chrome", "hidden");
  // Read right after the click: the controls fade again 2.5 s later.
  let chrome: string | null = null;
  await observe(page, info, { goLive }, async () => {
    await page.mouse.click(centreX(g), centreY(g));
    await page.waitForTimeout(300);
    chrome = await stageOf(page).frame.getAttribute("data-chrome");
  });
  expect.soft(chrome).toBe("shown");
  // Go live's menu didn't open: the click woke the controls instead.
  await expect.soft(goLive).not.toHaveAttribute("aria-expanded", "true");
  await expect.soft(page.getByRole("button", { name: "Share your screen" })).toHaveCount(0);
});

test("F-stage-fade.6 a control with the keyboard's focus keeps the controls shown", async ({ page }, info) => {
  await openScene(page, "s=live");
  const goLive = page.getByRole("button", { name: "Go live" });
  await page.keyboard.press("Tab");
  await goLive.focus();
  await observe(page, info, { goLive }, () => page.waitForTimeout(3200), { strip: 4, gap: 200 });
  expect.soft(await goLive.evaluate((b) => b.matches(":focus-visible"))).toBe(true);
  expect.soft(await seenOpacity(goLive)).toBe(1);
  expect.soft(await seenOpacity(page.getByRole("button", { name: "Fullscreen" }))).toBe(1);
});

test("F-stage-fade.7 the empty stage's controls never fade", async ({ page }, info) => {
  await openScene(page, "s=empty");
  const fullscreen = page.getByRole("button", { name: "Fullscreen" });
  const settings = page.getByRole("button", { name: "Settings" });
  await wakeStage(page);
  await observe(page, info, { fullscreen, settings }, () => restOnStage(page), { strip: 4, gap: 300 });
  await expect.soft(stageOf(page).frame).not.toHaveAttribute("data-chrome", /.*/);
  expect.soft(await seenOpacity(fullscreen)).toBe(1);
  expect.soft(await seenOpacity(settings)).toBe(1);
});

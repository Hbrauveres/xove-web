import { expect, test, type Page } from "@playwright/test";
import { blinks, drift } from "../support/frames.ts";
import { glassUnderBreakingParentsWhile } from "../support/glass.ts";
import { observe } from "../support/observe.ts";
import { openScene, wakeStage } from "../support/open.ts";
import { boxOf, centreX, centreY } from "../support/geometry.ts";
import { pointAt, pointAway } from "../support/pointer.ts";
import { shownOpacity } from "../support/screen.ts";
import { chromeOf, stageOf } from "../support/stage.ts";
import { CHROME_IDLE_MS, LOOK_EVERY_MS, spend, TIMER_SLACK_MS, untilStill } from "../support/timing.ts";
import { openMyStream } from "../controls/controls.ts";
import { restOnStage, stageParts } from "./stage.ts";

/** The controls shown and their fade over, or hidden and their fade over. */
async function controlsShown(page: Page): Promise<void> {
  await expect(chromeOf(page)).toHaveAttribute("data-chrome", "shown");
  await untilStill(stageOf(page), { property: "opacity" });
}
async function controlsHidden(page: Page): Promise<void> {
  await expect(chromeOf(page)).toHaveAttribute("data-chrome", "hidden", { timeout: CHROME_IDLE_MS * 2 });
  await untilStill(stageOf(page), { property: "opacity" });
}

/** How far above Go live a move over the picture lands, clear of every control (CSS px). */
const ABOVE = 120;

test("F-stage-fade.1 over a playing stream, the controls fade 2.5 s after the mouse stops", async ({ page }, info) => {
  await openScene(page, "s=live");
  const stage = stageParts(page);
  const goLive = page.getByRole("button", { name: "Go live" });
  const fullscreen = page.getByRole("button", { name: "Fullscreen" });
  const b = await boxOf(stage.box);
  // The mouse comes to rest on the stage, away from its controls.
  await page.mouse.move(centreX(b), b.y + b.height * 0.3);
  await page.mouse.move(centreX(b) + 4, b.y + b.height * 0.3 + 2);
  const restedAt = Date.now();
  // Half way through the wait: still shown.
  await spend(page, CHROME_IDLE_MS / 2);
  await expect.soft(chromeOf(page)).toHaveAttribute("data-chrome", "shown");
  expect.soft(await shownOpacity(goLive)).toBe(1);
  let hiddenAt = 0;
  const seen = await observe(page, info, { goLive, fullscreen }, async () => {
    await expect
      .poll(() => chromeOf(page).getAttribute("data-chrome"), { intervals: [LOOK_EVERY_MS], timeout: CHROME_IDLE_MS })
      .toBe("hidden");
    hiddenAt = Date.now();
    await untilStill(stageOf(page), { property: "opacity" });
  });
  // At its time: 2.5 s after the mouse stopped, neither sooner nor much later.
  expect.soft(hiddenAt - restedAt).toBeGreaterThanOrEqual(CHROME_IDLE_MS - TIMER_SLACK_MS);
  expect.soft(hiddenAt - restedAt).toBeLessThanOrEqual(CHROME_IDLE_MS + TIMER_SLACK_MS);
  await expect.soft(chromeOf(page)).toHaveAttribute("data-chrome", "hidden");
  expect.soft(await shownOpacity(goLive)).toBe(0);
  expect.soft(await shownOpacity(fullscreen)).toBe(0);
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
  await controlsHidden(page);
  // Read right after the move: the controls fade again 2.5 s later.
  let chrome: string | null = null;
  let opacity = 0;
  let after = before;
  const seen = await observe(page, info, { goLive, fullscreen }, async () => {
    await page.mouse.move(centreX(before), before.y - ABOVE, { steps: 3 });
    await controlsShown(page);
    chrome = await chromeOf(page).getAttribute("data-chrome");
    opacity = await shownOpacity(goLive);
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
  await controlsHidden(page);
  const stage = stageParts(page);
  const fullscreen = page.getByRole("button", { name: "Fullscreen" });
  await expect.soft(chromeOf(page)).toHaveAttribute("data-chrome", "hidden");
  const view = await boxOf(stage.view);
  const box = await boxOf(stage.box);
  // Read right after the move: the controls fade again 2.5 s later.
  let chrome: string | null = null;
  let opacity = 0;
  await observe(page, info, { fullscreen }, async () => {
    // The middle of the dark beside the picture (wide on a wide screen, narrow on one on its side).
    await page.mouse.move((box.x + view.x) / 2, centreY(view), { steps: 3 });
    await controlsShown(page);
    chrome = await chromeOf(page).getAttribute("data-chrome");
    opacity = await shownOpacity(fullscreen);
  });
  expect.soft(chrome).toBe("shown");
  expect.soft(opacity).toBe(1);
});

test("F-stage-fade.4 leaving the stage hides them at once", async ({ page }, info) => {
  await openScene(page, "s=live");
  await wakeStage(page);
  const goLive = page.getByRole("button", { name: "Go live" });
  const seen = await observe(page, info, { goLive }, async () => {
    await pointAway(page);
    // At once: well before the controls' own wait would end.
    await expect(chromeOf(page)).toHaveAttribute("data-chrome", "hidden", { timeout: CHROME_IDLE_MS / 2 });
  });
  await expect.soft(chromeOf(page)).toHaveAttribute("data-chrome", "hidden");
  expect.soft(await shownOpacity(goLive)).toBe(0);
  expect.soft(drift(seen.frames, "goLive")).toBeLessThan(1);
});

test("F-stage-fade.5 a click where a faded control was only brings the controls back", async ({ page }, info) => {
  await openScene(page, "s=live");
  await wakeStage(page);
  const goLive = page.getByRole("button", { name: "Go live" });
  const g = await boxOf(goLive);
  await page.mouse.move(centreX(g), g.y - ABOVE);
  await controlsHidden(page);
  await expect.soft(chromeOf(page)).toHaveAttribute("data-chrome", "hidden");
  // Read right after the click: the controls fade again 2.5 s later.
  let chrome: string | null = null;
  await observe(page, info, { goLive }, async () => {
    // A press landing on that spot while they're faded: played in the page at one instant, on what's
    // there now. (A mouse click moves first, and on a busy machine that move can wake the controls
    // and draw Go live before the press lands: a different case.)
    await page.evaluate(
      ({ x, y }) => {
        const there = document.elementFromPoint(x, y);
        const at = { bubbles: true, composed: true, clientX: x, clientY: y };
        for (const type of ["pointerdown", "mousedown", "pointerup", "mouseup"])
          there?.dispatchEvent(new PointerEvent(type, at));
        there?.dispatchEvent(new MouseEvent("click", at));
      },
      { x: centreX(g), y: centreY(g) },
    );
    await controlsShown(page);
    chrome = await chromeOf(page).getAttribute("data-chrome");
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
  // The whole wait the controls would otherwise fade after.
  await observe(page, info, { goLive }, () => spend(page, CHROME_IDLE_MS), { strip: 4, gap: 200 });
  expect.soft(await goLive.evaluate((b) => b.matches(":focus-visible"))).toBe(true);
  expect.soft(await shownOpacity(goLive)).toBe(1);
  expect.soft(await shownOpacity(page.getByRole("button", { name: "Fullscreen" }))).toBe(1);
});

test("F-stage-fade.7 the empty stage's controls never fade", async ({ page }, info) => {
  await openScene(page, "s=empty");
  const fullscreen = page.getByRole("button", { name: "Fullscreen" });
  const settings = page.getByRole("button", { name: "Settings" });
  await wakeStage(page);
  await observe(page, info, { fullscreen, settings }, () => restOnStage(page), { strip: 4, gap: 300 });
  await expect.soft(chromeOf(page)).toHaveCount(0);
  expect.soft(await shownOpacity(fullscreen)).toBe(1);
  expect.soft(await shownOpacity(settings)).toBe(1);
});

test("F-stage-fade.8 every glass fades itself, so it blurs all the way out and back in", async ({ page }) => {
  const scenes: [string, () => Promise<void>][] = [
    ["someone's screen, its sounds", () => openScene(page, "s=live&sound=1")],
    ["the small view", () => openScene(page, "s=facecam")],
    ["my own stream", () => openMyStream(page)],
  ];
  for (const [scene, open] of scenes) {
    await open();
    await wakeStage(page);
    await controlsShown(page);
    // Out: the mouse rests and every control fades; back in: a move wakes them.
    const out = await glassUnderBreakingParentsWhile(page, () => restOnStage(page).then(() => controlsHidden(page)));
    const back = await glassUnderBreakingParentsWhile(page, () => wakeStage(page).then(() => controlsShown(page)));
    expect.soft(out, `${scene}, fading out`).toEqual([]);
    expect.soft(back, `${scene}, coming back`).toEqual([]);
  }
});

test("F-stage-fade.9 the controls never fade while the pointer rests on one of them", async ({ page }, info) => {
  await openScene(page, "s=live&sound=1");
  await wakeStage(page);
  for (const name of ["Go live", "Mute the screen's sound", "Fullscreen"]) {
    const rested = page.getByRole("button", { name });
    await pointAt(page, rested);
    // Twice the wait they'd fade after.
    await observe(page, info, { rested }, () => spend(page, CHROME_IDLE_MS * 2), { strip: 4, gap: 600 });
    await expect.soft(chromeOf(page), name).toHaveAttribute("data-chrome", "shown");
    expect.soft(await shownOpacity(rested), name).toBe(1);
  }
  // Off the controls, on the picture: they fade as ever.
  await restOnStage(page);
  await controlsHidden(page);
});

import { expect, test, type Page } from "@playwright/test";
import { blinks, drift } from "../support/frames.ts";
import { observe } from "../support/observe.ts";
import { openScene, wakeStage } from "../support/open.ts";
import { boxOf, centreX, inside } from "../support/geometry.ts";
import { everyoneStops, marinaGoesLive } from "../support/harness.ts";
import { pxOf, SIZE } from "../support/looks.ts";
import { restOn } from "../support/pointer.ts";
import { afterFrames, HOVER_REST_MS, untilStill } from "../support/timing.ts";
import { stageParts, WIDE } from "./stage.ts";

/** Where the horizon sits on the empty stage, as a share of its height (the scene's `--horizon`). */
const HORIZON = 0.68;
/** Frames enough for the grid to have moved (or, still, not to). */
const SOME_FRAMES = 10;
/** The neon's rhythm (ms), and a moment of it when the tube is out (its first burst's first blink). */
const TUBE_MS = 11_000;
const TUBE_OUT = 0.304;

const goLive = (page: Page) => stageParts(page).view.getByRole("button", { name: "Go live" });
const menu = (page: Page) => page.getByRole("menu");
const row = (page: Page, name: string) => page.getByRole("menuitem", { name });
/** The empty stage's own parts: the eye on the horizon, and the floor's grid. */
const eye = (page: Page) => stageParts(page).view.locator('[data-part="eye"]');
const grid = (page: Page) => stageParts(page).view.locator('[data-part="grid"]');
const neon = (page: Page) => stageParts(page).view.locator("span[data-neon]");
const gridShift = (page: Page) => grid(page).evaluate((g) => getComputedStyle(g).transform);

/** The animations running on the empty stage, by name (the grid's, the neon's, the halo's). */
const running = (page: Page) =>
  stageParts(page).view.evaluate((v) =>
    document
      .getAnimations()
      .filter((a) => a.playState === "running" && v.contains((a.effect as KeyframeEffect | null)?.target ?? null))
      .map((a) => (a instanceof CSSAnimation ? a.animationName : "")),
  );

/** Starts counting what the old TV added to the stage (a canvas, the turn-on's flare) from now. */
const countTv = (page: Page) =>
  page.evaluate(() => {
    const w = window as unknown as { __tv: number };
    w.__tv = 0;
    new MutationObserver((changes) => {
      for (const c of changes)
        for (const n of c.addedNodes)
          if (
            n instanceof Element &&
            (n.matches('canvas, [data-part="flare"]') || n.querySelector('[data-part="flare"]'))
          )
            w.__tv++;
    }).observe(document.querySelector('section[aria-label="Shared screen"]') ?? document.body, {
      subtree: true,
      childList: true,
    });
  });
const tvSeen = (page: Page) => page.evaluate(() => (window as unknown as { __tv: number }).__tv);

test("F-empty-stage.1 nobody live: one way to start, Go live, centred on the floor below the horizon", async ({
  page,
}, info) => {
  await openScene(page, "s=empty");
  const stage = stageParts(page);
  const pill = goLive(page);
  await observe(page, info, { pill, view: stage.view }, () => wakeStage(page));
  await expect.soft(pill).toBeVisible();
  await expect.soft(stage.box.locator("video")).toHaveCount(0);
  // No words and no other way to start on the stage.
  await expect.soft(stage.view.getByRole("heading")).toHaveCount(0);
  await expect.soft(stage.view.getByRole("button", { name: "Share your screen" })).toHaveCount(0);
  await expect.soft(stage.view.getByRole("button", { name: "Turn on your camera" })).toHaveCount(0);
  await expect.soft(stage.view).not.toContainText(/standby|what's on today/i);
  const p = await boxOf(pill);
  const view = await boxOf(stage.view);
  expect.soft(Math.abs(centreX(p) - centreX(view))).toBeLessThan(2);
  expect.soft(p.y).toBeGreaterThan(view.y + view.height * HORIZON);
  expect.soft(inside(p, view)).toBe(true);
});

test("F-empty-stage.2 the empty stage is 16:9, framed by its four viewfinder corners, the top right red", async ({
  page,
}, info) => {
  await openScene(page, "s=empty");
  const stage = stageParts(page);
  const corners = stage.view.locator('span[data-at][aria-hidden="true"]');
  await observe(page, info, { view: stage.view }, () => wakeStage(page));
  const view = await boxOf(stage.view);
  expect.soft(Math.abs(view.width / view.height / WIDE - 1)).toBeLessThan(0.01);
  await expect.soft(corners).toHaveCount(4);
  for (const at of ["tl", "tr", "bl", "br"]) {
    const b = await boxOf(stage.view.locator(`span[data-at="${at}"][aria-hidden="true"]`));
    expect.soft(inside(b, view), at).toBe(true);
    // Each close to its own corner of the stage.
    const dx = at.endsWith("l") ? b.x - view.x : view.x + view.width - (b.x + b.width);
    const dy = at.startsWith("t") ? b.y - view.y : view.y + view.height - (b.y + b.height);
    expect.soft(Math.max(dx, dy), at).toBeLessThanOrEqual(12);
  }
  // The top right one is the red neon over its grey corner; the others are grey.
  const red = await neon(page).evaluate((e) => getComputedStyle(e, "::before").borderTopColor);
  const grey = await stage.view.locator('span[data-at="tl"]').evaluate((e) => getComputedStyle(e).borderTopColor);
  expect.soft(red).not.toBe(grey);
});

test("F-empty-stage.3 Go live opens its menu above it, and a click outside or Escape closes it", async ({
  page,
}, info) => {
  await openScene(page, "s=empty");
  const pill = goLive(page);
  await observe(page, info, { pill, menu: menu(page) }, async () => {
    await pill.click();
    await menu(page).waitFor();
  });
  await expect.soft(row(page, "Share your screen")).toBeVisible();
  await expect.soft(row(page, "Turn on your camera")).toBeVisible();
  await expect.soft(row(page, "Settings")).toBeVisible();
  const m = await boxOf(menu(page));
  expect.soft(m.y + m.height).toBeLessThanOrEqual((await boxOf(pill)).y);
  // A click on the stage's empty sky closes it.
  const view = await boxOf(stageParts(page).view);
  await page.mouse.click(view.x + view.width * 0.2, view.y + view.height * 0.2);
  await expect.soft(menu(page)).toHaveCount(0);
  await pill.click();
  await menu(page).waitFor();
  await page.keyboard.press("Escape");
  await expect.soft(menu(page)).toHaveCount(0);
});

test("F-empty-stage.4 Share your screen from Go live puts my shared screen on the stage", async ({ page }, info) => {
  await openScene(page, "s=empty");
  const stage = stageParts(page);
  const mine = stage.box.getByLabel("Your shared screen");
  await observe(page, info, { pill: goLive(page), mine }, async () => {
    await goLive(page).click();
    await row(page, "Share your screen").click();
    await mine.waitFor();
  });
  await expect.soft(mine).toBeVisible();
  await expect.soft(eye(page)).toHaveCount(0);
  await expect
    .soft(page.getByRole("button", { name: "Stop sharing your screen" }))
    .toHaveAttribute("aria-pressed", "true");
});

test("F-empty-stage.5 Turn on your camera from Go live puts my camera on the stage", async ({ page }, info) => {
  await openScene(page, "s=empty");
  const stage = stageParts(page);
  const mine = stage.box.locator(`video[aria-label="Your camera"]`);
  await observe(page, info, { pill: goLive(page), mine }, async () => {
    await goLive(page).click();
    await row(page, "Turn on your camera").click();
    await mine.waitFor();
  });
  await expect.soft(mine).toBeVisible();
  await expect.soft(eye(page)).toHaveCount(0);
});

test("F-empty-stage.6 with the keyboard, Go live shows its focus and Enter opens its menu", async ({ page }, info) => {
  await openScene(page, "s=empty");
  const pill = goLive(page);
  await page.keyboard.press("Tab");
  const seen = await observe(page, info, { pill }, async () => {
    await pill.focus();
  });
  expect.soft(await pill.evaluate((b) => b.matches(":focus-visible"))).toBe(true);
  // The app's focus ring: a 2 px outline, just outside the pill.
  const ring = await pill.evaluate((b) => {
    const st = getComputedStyle(b);
    return { style: st.outlineStyle, width: st.outlineWidth, offset: st.outlineOffset };
  });
  const width = `${await pxOf(page, SIZE.ring)}px`;
  expect.soft(ring).toEqual({ style: "solid", width, offset: width });
  expect.soft(drift(seen.frames, "pill")).toBeLessThan(1);
  await page.keyboard.press("Enter");
  await expect.soft(menu(page)).toBeVisible();
});

test("F-empty-stage.7 pointing at Go live: it doesn't move or blink", async ({ page }, info) => {
  await openScene(page, "s=empty");
  const pill = goLive(page);
  const seen = await observe(page, info, { pill }, async () => {
    await restOn(page, pill, HOVER_REST_MS);
  });
  expect.soft(drift(seen.frames, "pill")).toBeLessThan(1);
  expect.soft(blinks(seen.frames, "pill")).toEqual([]);
});

test("F-empty-stage.8 when the last stream stops, the empty stage is back with no TV: no static, no turn-on", async ({
  page,
}, info) => {
  await openScene(page, "s=empty");
  await marinaGoesLive(page);
  await stageParts(page).box.getByLabel("Marina's shared screen").waitFor();
  await untilStill(page);
  await countTv(page);
  await observe(page, info, { view: stageParts(page).view }, async () => {
    await everyoneStops(page);
    await goLive(page).waitFor();
  });
  await expect.soft(goLive(page)).toBeVisible();
  await expect.soft(eye(page)).toHaveCount(1);
  await expect.soft(stageParts(page).view.locator("canvas")).toHaveCount(0);
  expect.soft(await tvSeen(page)).toBe(0);
});

test("F-empty-stage.9 the grid slides toward us and the neon flickers, drawn without a canvas", async ({
  page,
}, info) => {
  await openScene(page, "s=empty");
  const first = await gridShift(page);
  await observe(page, info, { grid: grid(page), eye: eye(page) }, () => afterFrames(page, SOME_FRAMES));
  expect.soft(await gridShift(page)).not.toBe(first);
  await expect.soft(stageParts(page).view.locator("canvas")).toHaveCount(0);
  // The eye: cut in half by the horizon.
  const view = await boxOf(stageParts(page).view);
  const e = await boxOf(eye(page));
  expect.soft(Math.abs(e.y + e.height / 2 - (view.y + view.height * HORIZON))).toBeLessThan(2);
  // The tube goes out in its bursts: at one of them, its red is all but gone.
  const out = await neon(page).evaluate((n, at) => {
    for (const a of document.getAnimations()) {
      const effect = a.effect as KeyframeEffect | null;
      if (effect?.target === n && effect.pseudoElement === "::before") {
        a.pause();
        a.currentTime = at;
      }
    }
    return Number(getComputedStyle(n, "::before").opacity);
  }, TUBE_MS * TUBE_OUT);
  expect.soft(out).toBeLessThan(0.2);
});

test("F-empty-stage.10 with reduced motion, nothing on the empty stage moves", async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openScene(page, "s=empty");
  const first = await gridShift(page);
  await observe(page, info, { view: stageParts(page).view }, () => afterFrames(page, SOME_FRAMES));
  expect.soft(await gridShift(page)).toBe(first);
  expect.soft(await running(page)).toEqual([]);
});

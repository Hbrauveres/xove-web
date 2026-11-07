import { expect, test, type Page } from "@playwright/test";
import { blinks, drift } from "../support/frames.ts";
import { observe } from "../support/observe.ts";
import { openScene, wakeStage } from "../support/open.ts";
import { boxOf, centreX, centreY, everyoneStops, inside, marinaGoesLive, pointAt, stageOf } from "./stage.ts";

const screenButton = (page: Page) => page.getByRole("button", { name: "Share your screen" });
const cameraButton = (page: Page) => page.getByRole("button", { name: "Turn on your camera" });
/** The TV's static: a canvas the empty stage draws its snow on. */
const staticCanvas = (page: Page) => stageOf(page).view.locator('[class*="_static_"] canvas');
const staticPicture = (page: Page) => staticCanvas(page).evaluate((c: HTMLCanvasElement) => c.toDataURL());

/** Starts counting the TV's turning on (its flare appearing) from now. */
const countTurnOns = (page: Page) =>
  page.evaluate(() => {
    const w = window as unknown as { __turnOns: number };
    w.__turnOns = 0;
    new MutationObserver((changes) => {
      for (const c of changes)
        for (const n of c.addedNodes)
          if (n instanceof Element && (n.matches('[data-part="flare"]') || n.querySelector('[data-part="flare"]')))
            w.__turnOns++;
    }).observe(document.body, { subtree: true, childList: true });
  });
const turnOns = (page: Page) => page.evaluate(() => (window as unknown as { __turnOns: number }).__turnOns);

test("F-empty-stage.1 nobody live: the stage invites to go live, with Screen and Camera side by side", async ({
  page,
}, info) => {
  await openScene(page, "s=empty");
  const stage = stageOf(page);
  const heading = page.getByRole("heading", { name: "Go live" });
  const screen = screenButton(page);
  const camera = cameraButton(page);
  await observe(page, info, { heading, screen, camera }, () => wakeStage(page));
  await expect.soft(heading).toBeVisible();
  await expect.soft(heading.locator("em")).toHaveText("live");
  await expect.soft(screen).toHaveText("Screen");
  await expect.soft(camera).toHaveText("Camera");
  await expect.soft(stage.box.locator("video")).toHaveCount(0);
  const s = await boxOf(screen);
  const c = await boxOf(camera);
  const view = await boxOf(stage.view);
  expect.soft(Math.abs(s.width - c.width)).toBeLessThan(1);
  expect.soft(Math.abs(centreY(s) - centreY(c))).toBeLessThan(1);
  expect.soft(s.x + s.width).toBeLessThanOrEqual(c.x);
  // The pair in the stage's middle across.
  expect.soft(Math.abs((s.x + c.x + c.width) / 2 - centreX(view))).toBeLessThan(2);
  expect.soft(inside(view, s) && inside(view, c)).toBe(true);
});

test("F-empty-stage.2 the empty stage is 16:9, framed by its four viewfinder corners", async ({ page }, info) => {
  await openScene(page, "s=empty");
  const stage = stageOf(page);
  const corners = stage.view.locator('span[data-at][aria-hidden="true"]');
  await observe(page, info, { view: stage.view }, () => wakeStage(page));
  const view = await boxOf(stage.view);
  expect.soft(Math.abs(view.width / view.height / (16 / 9) - 1)).toBeLessThan(0.01);
  await expect.soft(corners).toHaveCount(4);
  for (const at of ["tl", "tr", "bl", "br"]) {
    const b = await boxOf(stage.view.locator(`span[data-at="${at}"][aria-hidden="true"]`));
    expect.soft(inside(view, b), at).toBe(true);
    // Each close to its own corner of the stage.
    const dx = at.endsWith("l") ? b.x - view.x : view.x + view.width - (b.x + b.width);
    const dy = at.startsWith("t") ? b.y - view.y : view.y + view.height - (b.y + b.height);
    expect.soft(Math.max(dx, dy), at).toBeLessThanOrEqual(12);
  }
  // The top right one is red, as in the logo; the others aren't.
  const colour = (at: string) =>
    stage.view.locator(`span[data-at="${at}"][aria-hidden="true"]`).evaluate((e) => getComputedStyle(e).borderTopColor);
  expect.soft(await colour("tr")).not.toBe(await colour("tl"));
});

test("F-empty-stage.3 pointing at Screen: nothing on the stage moves or blinks", async ({ page }, info) => {
  await openScene(page, "s=empty");
  const heading = page.getByRole("heading", { name: "Go live" });
  const screen = screenButton(page);
  const camera = cameraButton(page);
  const seen = await observe(page, info, { heading, screen, camera }, async () => {
    await pointAt(page, screen);
    await page.waitForTimeout(300);
  });
  for (const name of ["heading", "screen", "camera"]) {
    expect.soft(drift(seen.frames, name), name).toBeLessThan(1);
    expect.soft(blinks(seen.frames, name), name).toEqual([]);
  }
  await expect.soft(screen).toBeVisible();
});

test("F-empty-stage.4 a click on Screen puts my shared screen on the stage", async ({ page }, info) => {
  await openScene(page, "s=empty");
  const stage = stageOf(page);
  const mine = stage.box.getByLabel("Your shared screen");
  await observe(page, info, { screen: screenButton(page), mine }, async () => {
    await screenButton(page).click();
    await page.waitForTimeout(1200);
  });
  await expect.soft(mine).toBeVisible();
  await expect.soft(page.getByRole("heading", { name: "Go live" })).toHaveCount(0);
  await expect
    .soft(page.getByRole("button", { name: "Stop sharing your screen" }))
    .toHaveAttribute("aria-pressed", "true");
});

test("F-empty-stage.5 a click on Camera puts my camera on the stage", async ({ page }, info) => {
  await openScene(page, "s=empty");
  const stage = stageOf(page);
  const mine = stage.box.locator(`video[aria-label="Your camera"]`);
  await observe(page, info, { camera: cameraButton(page), mine }, async () => {
    await cameraButton(page).click();
    await page.waitForTimeout(1200);
  });
  await expect.soft(mine).toBeVisible();
  await expect.soft(page.getByRole("heading", { name: "Go live" })).toHaveCount(0);
});

test("F-empty-stage.6 with the keyboard, Screen shows its focus and Enter starts sharing", async ({ page }, info) => {
  await openScene(page, "s=empty");
  const screen = screenButton(page);
  await page.keyboard.press("Tab");
  const seen = await observe(page, info, { screen, camera: cameraButton(page) }, async () => {
    await screen.focus();
    await page.waitForTimeout(200);
  });
  expect.soft(await screen.evaluate((b) => b.matches(":focus-visible"))).toBe(true);
  // The app's focus ring: a 2 px outline in the accent, just outside the pill.
  const ring = await screen.evaluate((b) => {
    const st = getComputedStyle(b);
    return { style: st.outlineStyle, width: st.outlineWidth, offset: st.outlineOffset };
  });
  expect.soft(ring).toEqual({ style: "solid", width: "2px", offset: "2px" });
  expect.soft(drift(seen.frames, "camera")).toBeLessThan(1);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(1200);
  await expect.soft(stageOf(page).box.getByLabel("Your shared screen")).toBeVisible();
});

test("F-empty-stage.7 the TV turns on the first time the stage stands by, in under a second", async ({
  page,
}, info) => {
  await openScene(page, "s=live");
  await countTurnOns(page);
  const flare = page.locator('[data-part="flare"]');
  await observe(
    page,
    info,
    { flare, view: stageOf(page).view },
    async () => {
      await everyoneStops(page);
      await page.waitForTimeout(400);
    },
    { strip: 10, gap: 60 },
  );
  expect.soft(await turnOns(page)).toBe(1);
  // Gone again within a second of starting: only the static stays.
  await page.waitForTimeout(800);
  await expect.soft(flare).toHaveCount(0);
  await expect.soft(page.getByRole("heading", { name: "Go live" })).toBeVisible();
});

test("F-empty-stage.8 when the last stream stops again later, the TV doesn't turn on again", async ({ page }, info) => {
  await openScene(page, "s=empty");
  await marinaGoesLive(page);
  await page.waitForTimeout(2500);
  await expect.soft(stageOf(page).box.getByLabel("Marina's shared screen")).toBeVisible();
  await countTurnOns(page);
  await observe(page, info, { view: stageOf(page).view }, async () => {
    await everyoneStops(page);
    await page.waitForTimeout(1200);
  });
  await expect.soft(page.getByRole("heading", { name: "Go live" })).toBeVisible();
  expect.soft(await turnOns(page)).toBe(0);
});

test("F-empty-stage.9 the TV's static moves behind the way to start", async ({ page }, info) => {
  await openScene(page, "s=empty");
  const first = await staticPicture(page);
  await observe(page, info, { static: staticCanvas(page) }, () => page.waitForTimeout(300));
  expect.soft(await staticPicture(page)).not.toBe(first);
  // Behind the heading and the buttons, filling the stage.
  const view = await boxOf(stageOf(page).view);
  const s = await boxOf(staticCanvas(page));
  expect.soft(Math.abs(s.width - view.width) + Math.abs(s.height - view.height)).toBeLessThan(2);
});

test("F-empty-stage.10 with reduced motion, the static is still and the TV doesn't turn on", async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openScene(page, "s=live");
  await countTurnOns(page);
  await observe(page, info, { view: stageOf(page).view }, async () => {
    await everyoneStops(page);
    await page.waitForTimeout(900);
  });
  expect.soft(await turnOns(page)).toBe(0);
  const first = await staticPicture(page);
  await page.waitForTimeout(300);
  expect.soft(await staticPicture(page)).toBe(first);
});

import { expect, test } from "@playwright/test";
import { blinks, drift } from "../support/frames.ts";
import { openScene } from "../support/open.ts";
import { observe } from "../support/observe.ts";
import { boxOf, inside } from "../support/geometry.ts";
import { computed, LOOK, pxOf, SIZE, WEIGHT } from "../support/looks.ts";
import { pointAt, pointAway } from "../support/pointer.ts";
import { untilStill } from "../support/timing.ts";
import { pseudo, sharingMyScreen, watching } from "./where.ts";

test("F-pills.1 Go live is an M glass action pill with the live dot first, lighter when pointed at", async ({
  page,
}, info) => {
  await watching(page);
  const goLive = page.getByRole("button", { name: "Go live" });
  const dot = goLive.locator("i");
  // Read while the pointer rests on it: the stage's controls fade on their own a while after.
  let lit = "";
  const seen = await observe(page, info, { goLive, dot }, async () => {
    await pointAt(page, goLive);
    await untilStill(goLive);
    lit = await goLive.evaluate((e) => getComputedStyle(e).backgroundColor);
  });
  expect.soft(seen.before.goLive?.box?.h).toBe(await pxOf(page, SIZE.pillM));
  expect.soft(seen.before.goLive?.look?.backgroundColor).toBe(await computed(page, "background-color", LOOK.glass));
  expect.soft(seen.before.goLive?.text).toBe("Go live");
  await expect.soft(dot).toHaveCSS("background-color", await computed(page, "background-color", LOOK.accent));
  await expect.soft(dot).toHaveCSS("box-shadow", await computed(page, "box-shadow", LOOK.dotGlow));
  expect.soft(lit).toBe(await computed(page, "background-color", LOOK.glassLit));
  expect.soft(blinks(seen.frames, "dot")).toEqual([]);
  expect.soft(drift(seen.frames, "goLive")).toBeLessThan(1);
});

test("F-pills.2 the empty stage's Screen and Camera are L pills of one width, red then soft, each lighter when pointed at", async ({
  page,
}, info) => {
  await openScene(page, "s=empty");
  const screen = page.getByRole("button", { name: "Share your screen" });
  const camera = page.getByRole("button", { name: "Turn on your camera" });
  const seen = await observe(page, info, { screen, camera }, async () => {
    await pointAt(page, screen);
  });
  const pillL = await pxOf(page, SIZE.pillL);
  expect.soft(seen.before.screen?.box?.h).toBe(pillL);
  expect.soft(seen.before.camera?.box?.h).toBe(pillL);
  expect.soft(seen.before.screen?.box?.w).toBe(seen.before.camera?.box?.w);
  expect.soft(seen.before.screen?.look?.backgroundColor).toBe(await computed(page, "background-color", LOOK.accent));
  expect.soft(seen.before.screen?.look?.color).toBe(await computed(page, "color", LOOK.accentInk));
  expect.soft(seen.before.camera?.look?.backgroundColor).toBe(await computed(page, "background-color", LOOK.soft));
  await expect.soft(screen).toHaveCSS("background-color", await computed(page, "background-color", LOOK.accentLight));
  await expect.soft(screen).toHaveText("Screen");
  await expect.soft(camera).toHaveText("Camera");
  await pointAt(page, camera);
  await expect.soft(camera).toHaveCSS("background-color", await computed(page, "background-color", LOOK.softLit));
  expect.soft(drift(seen.frames, "camera")).toBeLessThan(1);
});

test("F-pills.3 a label pill names a preview: 22 px of glass, a face, then its words", async ({ page }, info) => {
  await watching(page);
  const preview = page.getByRole("button", { name: "Watch Rafa · screen" });
  const pill = preview.getByText("Rafa · screen", { exact: true });
  await observe(page, info, { preview, pill }, async () => {
    await pointAway(page);
  });
  await expect.soft(pill).toBeVisible();
  expect.soft((await boxOf(pill)).height).toBe(await pxOf(page, SIZE.labelPill));
  await expect.soft(pill).toHaveCSS("background-color", await computed(page, "background-color", LOOK.glass));
  await expect.soft(pill).toHaveCSS("font-weight", WEIGHT.medium);
  await expect.soft(pill.locator("[data-initial]")).toHaveAttribute("data-initial", "R");
  // Inside its picture.
  expect.soft(inside(await boxOf(pill), await boxOf(preview))).toBe(true);
});

test("F-pills.4 the stat pill counts who's watching: faces, then the number, 'watching' said, not shown", async ({
  page,
}, info) => {
  await watching(page);
  const count = page.getByText("3", { exact: true }).filter({ has: page.locator(":scope:is(b)") });
  const unit = page.getByText("watching", { exact: true });
  await observe(page, info, { count, unit }, async () => {
    await pointAway(page);
  });
  await expect.soft(count).toBeVisible();
  await expect.soft(count).toHaveCSS("font-weight", WEIGHT.semibold);
  const pill = count.locator("xpath=..");
  await expect.soft(pill).toHaveCSS("background-color", await computed(page, "background-color", LOOK.glass));
  expect.soft((await boxOf(pill)).height).toBe(await pxOf(page, SIZE.statPill));
  await expect.soft(pill.locator("[data-initial]")).toHaveCount(3);
  // Said to screen readers, unseen: a 1 px box clipped away.
  await expect.soft(unit).toHaveCSS("clip-path", await computed(page, "clip-path", LOOK.unseen));
  await expect.soft(unit).toHaveCSS("position", "absolute");
});

test("F-pills.5 LIVE beside who's on the stage: a red tag in the mono face, its dot pulsing", async ({
  page,
}, info) => {
  await watching(page);
  const live = page.getByText("LIVE", { exact: true }).first();
  await observe(page, info, { live }, async () => {
    await pointAway(page);
  });
  await expect.soft(live).toBeVisible();
  await expect.soft(live).toHaveCSS("background-color", await computed(page, "background-color", LOOK.accent));
  await expect.soft(live).toHaveCSS("color", await computed(page, "color", LOOK.accentInk));
  await expect.soft(live).toHaveCSS("font-family", await computed(page, "font-family", LOOK.fontMono));
  expect.soft(await pseudo(live, "::before", "animation-name")).toMatch(/pulse/);
  expect
    .soft(await pseudo(live, "::before", "animation-duration"))
    .toBe(await computed(page, "animation-duration", LOOK.pulse));
});

test("F-pills.6 a heading's count chip turns neutral once no request waits", async ({ page }, info) => {
  await openScene(page, "page=admin");
  const waiting = page.getByRole("heading", { name: /^Waiting for access/ }).locator("span");
  const members = page.getByRole("heading", { name: /^Members/ }).locator("span");
  await observe(page, info, { waiting, members }, async () => {
    await page.getByRole("button", { name: "Approve" }).click();
  });
  await expect.soft(waiting).toHaveText("0");
  await expect.soft(waiting).toHaveAttribute("data-tone", "neutral");
  await expect.soft(waiting).toHaveCSS("background-color", await computed(page, "background-color", LOOK.chip));
  await expect.soft(members).toHaveText("1");
  await expect.soft(members).toHaveAttribute("data-tone", "neutral");
  await expect.soft(members).toHaveCSS("color", await computed(page, "color", LOOK.text));
});

test("F-pills.7 with a request waiting, its chip is red: the light accent on a red tint", async ({ page }, info) => {
  await openScene(page, "page=admin");
  const chip = page.getByRole("heading", { name: /^Waiting for access/ }).locator("span");
  await observe(page, info, { chip }, async () => {
    await pointAway(page);
  });
  await expect.soft(chip).toHaveText("1");
  await expect.soft(chip).toHaveAttribute("data-tone", "attention");
  await expect.soft(chip).toHaveCSS("color", await computed(page, "color", LOOK.accentLight));
  const box = await boxOf(chip);
  const size = await pxOf(page, SIZE.chip);
  expect.soft(box.height).toBe(size);
  expect.soft(box.width).toBeGreaterThanOrEqual(size);
});

test("F-pills.8 a small button with words is the dark pill: my drop-up's Change, 30 px, semibold", async ({
  page,
}, info) => {
  await sharingMyScreen(page);
  const button = page.getByRole("button", { name: "Stop sharing your screen" });
  const change = page.getByRole("group", { name: "What you share" }).getByRole("button", { name: "Change" });
  let lit = "";
  const seen = await observe(page, info, { change }, async () => {
    await pointAt(page, button);
    await change.waitFor();
    await untilStill(change);
    await pointAt(page, change);
    await untilStill(change);
    lit = await change.evaluate((e) => getComputedStyle(e).backgroundColor);
  });
  expect.soft(seen.after.change?.box?.h).toBe(await pxOf(page, SIZE.pillS));
  await expect.soft(change).toHaveCSS("font-weight", WEIGHT.semibold);
  await expect.soft(change).toHaveCSS("color", await computed(page, "color", LOOK.text));
  expect.soft(lit).not.toBe(await computed(page, "background-color", LOOK.selected));
  await pointAway(page);
  await expect.soft(change).toHaveCSS("background-color", await computed(page, "background-color", LOOK.selected));
  expect.soft(drift(seen.frames, "change")).toBeLessThan(1);
});

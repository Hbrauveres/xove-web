import { expect, test } from "@playwright/test";
import { blinks, drift } from "../support/frames.ts";
import { openScene } from "../support/open.ts";
import { observe } from "../support/observe.ts";
import { COLOR, pointAt, pseudo, watching } from "./where.ts";

test("F-pills.1 Go live is an M glass action pill with the live dot first, lighter when pointed at", async ({
  page,
}, info) => {
  await watching(page);
  const goLive = page.getByRole("button", { name: "Go live" });
  const dot = goLive.locator("i");
  // Read while the pointer rests on it: the stage's controls fade on their own a while after.
  let lit = "";
  const seen = await observe(
    page,
    info,
    { goLive, dot },
    async () => {
      await pointAt(page, goLive);
      await page.waitForTimeout(200);
      lit = await goLive.evaluate((e) => getComputedStyle(e).backgroundColor);
    },
    { settle: 100 },
  );
  expect.soft(seen.before.goLive?.box?.h).toBe(34);
  expect.soft(seen.before.goLive?.look?.backgroundColor).toBe(COLOR.glass);
  expect.soft(seen.before.goLive?.text).toBe("Go live");
  await expect.soft(dot).toHaveCSS("background-color", COLOR.accent);
  expect.soft(lit).toBe(COLOR.glassLit);
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
    await page.waitForTimeout(200);
  });
  expect.soft(seen.before.screen?.box?.h).toBe(44);
  expect.soft(seen.before.camera?.box?.h).toBe(44);
  expect.soft(seen.before.screen?.box?.w).toBe(seen.before.camera?.box?.w);
  expect.soft(seen.before.screen?.look?.backgroundColor).toBe(COLOR.accent);
  expect.soft(seen.before.screen?.look?.color).toBe(COLOR.accentInk);
  expect.soft(seen.before.camera?.look?.backgroundColor).toBe("rgba(235, 235, 236, 0.08)");
  await expect.soft(screen).toHaveCSS("background-color", COLOR.accentLight);
  await expect.soft(screen).toHaveText("Screen");
  await expect.soft(camera).toHaveText("Camera");
  await pointAt(page, camera);
  await expect.soft(camera).toHaveCSS("background-color", "rgba(235, 235, 236, 0.14)");
  expect.soft(drift(seen.frames, "camera")).toBeLessThan(1);
});

test("F-pills.3 a label pill names a preview: 22 px of glass, a face, then its words", async ({ page }, info) => {
  await watching(page);
  const preview = page.getByRole("button", { name: "Watch Rafa · screen" });
  const pill = preview.getByText("Rafa · screen", { exact: true });
  await observe(page, info, { preview, pill }, async () => {
    await page.mouse.move(2, 2);
  });
  await expect.soft(pill).toBeVisible();
  expect.soft((await pill.boundingBox())?.height).toBe(22);
  await expect.soft(pill).toHaveCSS("background-color", COLOR.glass);
  await expect.soft(pill).toHaveCSS("font-weight", "500");
  await expect.soft(pill.locator("[data-initial]")).toHaveAttribute("data-initial", "R");
  // Inside its picture.
  const p = await preview.boundingBox();
  const b = await pill.boundingBox();
  expect.soft(b && p && b.x >= p.x && b.y >= p.y && b.x + b.width <= p.x + p.width).toBe(true);
});

test("F-pills.4 the stat pill counts who's watching: faces, then the number, 'watching' said, not shown", async ({
  page,
}, info) => {
  await watching(page);
  const count = page.getByText("3", { exact: true }).filter({ has: page.locator(":scope:is(b)") });
  const unit = page.getByText("watching", { exact: true });
  await observe(page, info, { count, unit }, async () => {
    await page.mouse.move(2, 2);
  });
  await expect.soft(count).toBeVisible();
  await expect.soft(count).toHaveCSS("font-weight", "600");
  const pill = count.locator("xpath=..");
  await expect.soft(pill).toHaveCSS("background-color", COLOR.glass);
  expect.soft((await pill.boundingBox())?.height).toBe(26);
  await expect.soft(pill.locator("[data-initial]")).toHaveCount(3);
  // Said to screen readers, unseen: a 1 px box clipped away.
  await expect.soft(unit).toHaveCSS("clip-path", "inset(50%)");
  await expect.soft(unit).toHaveCSS("position", "absolute");
});

test("F-pills.5 LIVE beside who's on the stage: a red tag in the mono face, its dot pulsing", async ({
  page,
}, info) => {
  await watching(page);
  const live = page.getByText("LIVE", { exact: true }).first();
  await observe(page, info, { live }, async () => {
    await page.mouse.move(2, 2);
  });
  await expect.soft(live).toBeVisible();
  await expect.soft(live).toHaveCSS("background-color", COLOR.accent);
  await expect.soft(live).toHaveCSS("color", COLOR.accentInk);
  await expect.soft(live).toHaveCSS("font-family", /IBM Plex Mono/);
  expect.soft(await pseudo(live, "::before", "animation-name")).toMatch(/pulse/);
  expect.soft(await pseudo(live, "::before", "animation-duration")).toBe("1.6s");
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
  await expect.soft(waiting).toHaveCSS("background-color", "rgba(255, 255, 255, 0.1)");
  await expect.soft(members).toHaveText("1");
  await expect.soft(members).toHaveAttribute("data-tone", "neutral");
  await expect.soft(members).toHaveCSS("color", COLOR.text);
});

test("F-pills.7 with a request waiting, its chip is red: the light accent on a red tint", async ({ page }, info) => {
  await openScene(page, "page=admin");
  const chip = page.getByRole("heading", { name: /^Waiting for access/ }).locator("span");
  await observe(page, info, { chip }, async () => {
    await page.mouse.move(2, 2);
  });
  await expect.soft(chip).toHaveText("1");
  await expect.soft(chip).toHaveAttribute("data-tone", "attention");
  await expect.soft(chip).toHaveCSS("color", COLOR.accentLight);
  const box = await chip.boundingBox();
  expect.soft(box?.height).toBe(20);
  expect.soft(box?.width).toBeGreaterThanOrEqual(20);
});

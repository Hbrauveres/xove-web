import { expect, test } from "@playwright/test";
import { openScene } from "../support/open.ts";
import { observe } from "../support/observe.ts";
import { boxOf } from "../support/geometry.ts";
import { APP_PX, computed, LOOK, SIZE, within } from "../support/looks.ts";
import { pointAt, pointAway } from "../support/pointer.ts";
import { sharingMyScreen } from "./where.ts";

test("F-text-blocks.1 a headline's key words are red capitals, written as a word", async ({ page }, info) => {
  await openScene(page, "s=empty");
  const heading = page.getByRole("heading", { level: 2, name: "Go live" });
  const live = heading.locator("em");
  await observe(page, info, { heading }, async () => {
    await pointAway(page);
  });
  await expect.soft(live).toHaveText("live");
  expect.soft(await live.evaluate((e) => (e as HTMLElement).innerText)).toBe("LIVE");
  await expect.soft(live).toHaveCSS("color", await computed(page, "color", LOOK.accent));
  await expect.soft(live).toHaveCSS("font-style", "normal");
  await expect.soft(heading).toHaveCSS("font-family", await computed(page, "font-family", LOOK.fontDisplay));
});

test("F-text-blocks.2 a section heading: 12 px muted capitals, no line, its count's chip centred beside it", async ({
  page,
}, info) => {
  await openScene(page, "page=admin");
  const heading = page.getByRole("heading", { level: 2, name: /^Members/ });
  const chip = heading.locator("span");
  await observe(page, info, { heading, chip }, async () => {
    await pointAway(page);
  });
  await expect.soft(heading).toHaveCSS("text-transform", "uppercase");
  await expect.soft(heading).toHaveCSS("font-size", await computed(page, "font-size", SIZE.headingText));
  await expect.soft(heading).toHaveCSS("color", await computed(page, "color", LOOK.muted));
  await expect.soft(heading).toHaveCSS("border-bottom-style", "none");
  const h = await boxOf(heading);
  const c = await boxOf(chip);
  expect.soft(Math.abs(h.y + h.height / 2 - (c.y + c.height / 2))).toBeLessThan(1);
});

test("F-text-blocks.3 an error notice: a red-tinted box with a red border, read out as it appears", async ({
  page,
}, info) => {
  await openScene(page, "page=home&error=login-failed");
  const notice = page.getByRole("alert");
  await observe(page, info, { notice }, async () => {
    await pointAway(page);
  });
  await expect.soft(notice).toHaveCSS("background-color", await computed(page, "background-color", LOOK.alertTint));
  await expect.soft(notice).toHaveCSS("border-top-color", await computed(page, "border-top-color", LOOK.alertLine));
  await expect.soft(notice).toHaveCSS("border-top-width", await computed(page, "width", SIZE.hairline));
  await expect.soft(notice).toHaveCSS("color", await computed(page, "color", LOOK.text));
  await expect.soft(notice).toHaveCSS("font-size", await computed(page, "font-size", SIZE.noticeText));
});

test("F-text-blocks.4 a face without a photo shows an initial that's drawn, not read", async ({ page }, info) => {
  await openScene(page, "page=admin");
  const marina = page.getByRole("listitem").filter({ hasText: "Marina Costa" });
  const face = marina.locator("[data-initial]");
  await observe(page, info, { face }, async () => {
    await pointAway(page);
  });
  await expect.soft(face).toHaveAttribute("data-initial", "M");
  await expect.soft(face).toHaveAttribute("aria-hidden", "true");
  await expect.soft(face).toHaveCSS("border-radius", LOOK.round);
  await expect.soft(face).toHaveCSS("color", await computed(page, "color", LOOK.accent));
  const box = await boxOf(face);
  expect.soft(box.width).toBe(APP_PX.adminFace);
  expect.soft(box.height).toBe(APP_PX.adminFace);
  // The initial isn't text: the row reads its name and email only.
  expect.soft((await marina.innerText()).startsWith("Marina Costa")).toBe(true);
});

test("F-text-blocks.5 the face of who's live on the stage wears a red ring, apart from it by the ground", async ({
  page,
}, info) => {
  await openScene(page, "s=live");
  const face = page.locator("[data-ring]").first();
  await observe(page, info, { face }, async () => {
    await pointAway(page);
  });
  await expect.soft(face).toHaveAttribute("data-initial", "M");
  const ring = await face.evaluate(
    (e) => getComputedStyle(e).boxShadow + " | " + getComputedStyle(e, "::after").boxShadow,
  );
  expect.soft(ring).toMatch(within(await computed(page, "color", LOOK.accent)));
  expect.soft(ring).toMatch(within(await computed(page, "color", LOOK.ground)));
});

test("F-text-blocks.6 with the settings open, resting on a live button cues its control: a red ring pulsing twice, then lit", async ({
  page,
}, info) => {
  await sharingMyScreen(page);
  await page.getByRole("button", { name: "Settings" }).click();
  const panel = page.getByRole("dialog", { name: "Settings" });
  await panel.getByRole("tab", { name: "Voice" }).click();
  const button = page.getByRole("button", { name: "Stop sharing your screen" });
  const cue = panel.locator("[data-cue]");
  await observe(page, info, { button, cue }, async () => {
    await pointAt(page, button);
    await cue.waitFor();
  });
  await expect.soft(panel.getByRole("tab", { name: "Screen" })).toHaveAttribute("aria-selected", "true");
  await expect.soft(cue).toHaveCount(1);
  await expect.soft(cue).toHaveCSS("animation-name", /pulse.*, .*settle/);
  await expect.soft(cue).toHaveCSS("animation-iteration-count", "2, 1");
  await expect.soft(cue).toHaveCSS("pointer-events", "none");
  // The cue rings the Change pill, over it.
  const c = await boxOf(cue);
  const change = await boxOf(panel.getByRole("button", { name: "Change" }));
  expect.soft(Math.abs(c.x - change.x)).toBeLessThan(1);
  expect.soft(Math.abs(c.width - change.width)).toBeLessThan(1);
});

test("F-text-blocks.7 a cue stays lit until the next press anywhere else", async ({ page }, info) => {
  await sharingMyScreen(page);
  await page.getByRole("button", { name: "Settings" }).click();
  const panel = page.getByRole("dialog", { name: "Settings" });
  await pointAt(page, page.getByRole("button", { name: "Stop sharing your screen" }));
  const cue = panel.locator("[data-cue]");
  await cue.waitFor();
  await expect.soft(cue).toHaveCount(1);
  await observe(page, info, { cue }, async () => {
    await panel.getByRole("heading", { name: "Settings" }).click();
  });
  await expect.soft(cue).toHaveCount(0);
  await expect.soft(panel).toBeVisible();
});

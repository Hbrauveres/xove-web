import { expect, test } from "@playwright/test";
import { openScene } from "../support/open.ts";
import { observe } from "../support/observe.ts";
import { COLOR, pointAt, sharingMyScreen } from "./where.ts";

test("F-text-blocks.1 a headline's key words are red capitals, written as a word", async ({ page }, info) => {
  await openScene(page, "s=empty");
  const heading = page.getByRole("heading", { level: 2, name: "Go live" });
  const live = heading.locator("em");
  await observe(page, info, { heading }, async () => {
    await page.mouse.move(2, 2);
  });
  await expect.soft(live).toHaveText("live");
  expect.soft(await live.evaluate((e) => (e as HTMLElement).innerText)).toBe("LIVE");
  await expect.soft(live).toHaveCSS("color", COLOR.accent);
  await expect.soft(live).toHaveCSS("font-style", "normal");
  await expect.soft(heading).toHaveCSS("font-family", /^"Bricolage Grotesque"/);
});

test("F-text-blocks.2 a section heading: 12 px muted capitals, no line, its count's chip centred beside it", async ({
  page,
}, info) => {
  await openScene(page, "page=admin");
  const heading = page.getByRole("heading", { level: 2, name: /^Members/ });
  const chip = heading.locator("span");
  await observe(page, info, { heading, chip }, async () => {
    await page.mouse.move(2, 2);
  });
  await expect.soft(heading).toHaveCSS("text-transform", "uppercase");
  await expect.soft(heading).toHaveCSS("font-size", "12px");
  await expect.soft(heading).toHaveCSS("color", COLOR.muted);
  await expect.soft(heading).toHaveCSS("border-bottom-style", "none");
  const h = await heading.boundingBox();
  const c = await chip.boundingBox();
  expect.soft(Math.abs((h?.y ?? 0) + (h?.height ?? 0) / 2 - ((c?.y ?? 0) + (c?.height ?? 0) / 2))).toBeLessThan(1);
});

test("F-text-blocks.3 an error notice: a red-tinted box with a red border, read out as it appears", async ({
  page,
}, info) => {
  await openScene(page, "page=home&error=login-failed");
  const notice = page.getByRole("alert");
  await observe(page, info, { notice }, async () => {
    await page.mouse.move(2, 2);
  });
  await expect.soft(notice).toHaveCSS("background-color", /0\.937.* 0\.294.* 0\.294.* \/ 0\.1\)/);
  await expect.soft(notice).toHaveCSS("border-top-color", /0\.937.* 0\.294.* 0\.294.* \/ 0\.45\)/);
  await expect.soft(notice).toHaveCSS("border-top-width", "1px");
  await expect.soft(notice).toHaveCSS("color", COLOR.text);
  await expect.soft(notice).toHaveCSS("font-size", "13px");
});

test("F-text-blocks.4 a face without a photo shows an initial that's drawn, not read", async ({ page }, info) => {
  await openScene(page, "page=admin");
  const marina = page.getByRole("listitem").filter({ hasText: "Marina Costa" });
  const face = marina.locator("[data-initial]");
  await observe(page, info, { face }, async () => {
    await page.mouse.move(2, 2);
  });
  await expect.soft(face).toHaveAttribute("data-initial", "M");
  await expect.soft(face).toHaveAttribute("aria-hidden", "true");
  await expect.soft(face).toHaveCSS("border-radius", "50%");
  await expect.soft(face).toHaveCSS("color", COLOR.accent);
  const box = await face.boundingBox();
  expect.soft(box?.width).toBe(36);
  expect.soft(box?.height).toBe(36);
  // The initial isn't text: the row reads its name and email only.
  expect.soft((await marina.innerText()).startsWith("Marina Costa")).toBe(true);
});

test("F-text-blocks.5 the face of who's live on the stage wears a red ring, apart from it by the ground", async ({
  page,
}, info) => {
  await openScene(page, "s=live");
  const face = page.locator("[data-ring]").first();
  await observe(page, info, { face }, async () => {
    await page.mouse.move(2, 2);
  });
  await expect.soft(face).toHaveAttribute("data-initial", "M");
  const ring = await face.evaluate(
    (e) => getComputedStyle(e).boxShadow + " | " + getComputedStyle(e, "::after").boxShadow,
  );
  expect.soft(ring).toMatch(/rgb\(239, 75, 75\)/);
  expect.soft(ring).toMatch(/rgb\(12, 12, 13\)/);
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
    await page.waitForTimeout(400);
  });
  await expect.soft(panel.getByRole("tab", { name: "Screen" })).toHaveAttribute("aria-selected", "true");
  await expect.soft(cue).toHaveCount(1);
  await expect.soft(cue).toHaveCSS("animation-name", /pulse.*, .*settle/);
  await expect.soft(cue).toHaveCSS("animation-iteration-count", "2, 1");
  await expect.soft(cue).toHaveCSS("pointer-events", "none");
  // The cue rings the Change pill, over it.
  const c = await cue.boundingBox();
  const change = await panel.getByRole("button", { name: "Change" }).boundingBox();
  expect.soft(c && change && Math.abs(c.x - change.x) < 1 && Math.abs(c.width - change.width) < 1).toBe(true);
});

test("F-text-blocks.7 a cue stays lit until the next press anywhere else", async ({ page }, info) => {
  await sharingMyScreen(page);
  await page.getByRole("button", { name: "Settings" }).click();
  const panel = page.getByRole("dialog", { name: "Settings" });
  await pointAt(page, page.getByRole("button", { name: "Stop sharing your screen" }));
  await page.waitForTimeout(400);
  const cue = panel.locator("[data-cue]");
  await expect.soft(cue).toHaveCount(1);
  await observe(page, info, { cue }, async () => {
    await panel.getByRole("heading", { name: "Settings" }).click();
  });
  await expect.soft(cue).toHaveCount(0);
  await expect.soft(panel).toBeVisible();
});

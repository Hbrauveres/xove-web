import { expect, test, type Page } from "@playwright/test";
import { observe } from "../support/observe.ts";
import { openScene, wakeStage } from "../support/open.ts";
import { boxOf, centreX, inside, windowBox } from "./room.ts";

const stageOf = (page: Page) => page.getByRole("region", { name: "Shared screen" });
/** The toast: the stage's live region, a pill while it says something. */
const toastOf = (page: Page) => stageOf(page).locator("output");
const button = (page: Page, name: string) => page.getByRole("button", { name, exact: true });

/** A click with the mouse, as a person would: a greyed control reads as disabled to the test's own click. */
async function press(page: Page, name: string) {
  const b = await boxOf(button(page, name));
  await page.mouse.click(centreX(b), b.y + b.height / 2);
}

test("F-toast.1 a click on a greyed control says why, at the top centre of the player", async ({ page }, info) => {
  await openScene(page, "s=live");
  await wakeStage(page);
  const toast = toastOf(page);
  const sound = button(page, "No sound in this stream");
  await observe(page, info, { toast, sound }, async () => {
    await press(page, "No sound in this stream");
  });
  await expect.soft(toast).toHaveText("No sound in this stream");
  await expect.soft(toast).toHaveAttribute("data-show", "true");
  await expect.soft(toast).toHaveAttribute("aria-live", "polite");
  await expect.soft(toast).toHaveRole("status");
  // With the control's icon, crossed out.
  await expect.soft(toast.locator('svg[data-icon="volume-off"]')).toHaveCount(1);
  const t = await boxOf(toast);
  const box = await boxOf(stageOf(page).locator("> div").first());
  expect.soft(inside(box, t)).toBe(true);
  expect.soft(inside(windowBox(page), t)).toBe(true);
  expect.soft(Math.abs(centreX(t) - centreX(box))).toBeLessThan(1);
  expect.soft(t.y - box.y).toBeLessThan(box.height / 4);
  expect.soft(t.width).toBeLessThanOrEqual(360.5);
});

test("F-toast.2 it comes in with a fade and a small drop, without a jump", async ({ page }, info) => {
  await openScene(page, "s=live");
  await wakeStage(page);
  const toast = toastOf(page);
  const seen = await observe(page, info, { toast }, async () => {
    await press(page, "No sound in this stream");
  });
  const opacities = seen.frames.map((f) => f.seen.toast?.opacity ?? 0);
  // Some frames in between: a fade, not a pop.
  expect.soft(opacities.filter((o) => o > 0.05 && o < 0.95).length).toBeGreaterThanOrEqual(2);
  expect.soft(opacities.at(-1)).toBeGreaterThan(0.95);
  // Once it has words (the empty live region is a dot at the centre): it drops 6 px at most, and
  // stays centred across the player.
  const boxes = seen.frames.flatMap((f) => {
    const b = f.seen.toast?.box;
    return b && b.w > 20 && (f.seen.toast?.opacity ?? 0) > 0.01 ? [b] : [];
  });
  const tops = boxes.map((b) => b.y);
  const centres = boxes.map((b) => b.x + b.w / 2);
  expect.soft(boxes.length).toBeGreaterThan(2);
  expect.soft(Math.max(...tops) - Math.min(...tops)).toBeLessThanOrEqual(6.5);
  expect.soft(Math.max(...centres) - Math.min(...centres)).toBeLessThan(1);
  // It comes down, never up.
  expect.soft(tops.at(-1)! - tops[0]!).toBeGreaterThanOrEqual(0);
});

test("F-toast.3 it stays 3 seconds, then fades out by itself", async ({ page }, info) => {
  await openScene(page, "s=live");
  await wakeStage(page);
  const toast = toastOf(page);
  await press(page, "No sound in this stream");
  await expect(toast).toHaveAttribute("data-show", "true");
  await page.waitForTimeout(2700);
  await expect.soft(toast).toHaveAttribute("data-show", "true");
  await observe(page, info, { toast }, async () => {
    await expect(toast).not.toHaveAttribute("data-show", { timeout: 1000 });
  });
  await expect.soft(toast).not.toHaveAttribute("data-show");
  // Its words go once it has faded.
  await expect.soft(toast).toHaveText("", { timeout: 1000 });
});

test("F-toast.4 one at a time: a newer message replaces the last", async ({ page }, info) => {
  await openScene(page, "s=live");
  await wakeStage(page);
  const toast = toastOf(page);
  await press(page, "No sound in this stream");
  const first = Date.now();
  await expect(toast).toHaveText("No sound in this stream");
  await page.waitForTimeout(1500);
  await observe(page, info, { toast }, async () => {
    await press(page, "Marina's mic is off");
  });
  await expect.soft(toast).toHaveText("Marina's mic is off");
  await expect.soft(page.locator("output[data-show]")).toHaveCount(1);
  // A new message starts its own 3 s: still there after the first one's 3 s are over.
  await page.waitForTimeout(Math.max(0, first + 3400 - Date.now()));
  await expect.soft(toast).toHaveText("Marina's mic is off");
  await expect.soft(toast).toHaveAttribute("data-show", "true");
});

test("F-toast.5 it never takes a click: what's under it still gets it", async ({ page }, info) => {
  await openScene(page, "s=live");
  await wakeStage(page);
  const toast = toastOf(page);
  await press(page, "No sound in this stream");
  await expect(toast).toHaveAttribute("data-show", "true");
  // Faded in fully first.
  await page.waitForTimeout(400);
  const t = await boxOf(toast);
  const seen = await observe(page, info, { toast }, async () => {
    await page.mouse.move(centreX(t), t.y + t.height / 2);
  });
  const under = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest("output") === null, {
    x: centreX(t),
    y: t.y + t.height / 2,
  });
  expect.soft(under).toBe(true);
  expect.soft(await toast.evaluate((el) => getComputedStyle(el).pointerEvents)).toBe("none");
  expect.soft(seen.after.toast?.look).toEqual(seen.before.toast?.look);
});

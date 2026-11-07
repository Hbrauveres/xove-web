import { expect, test, type Locator, type Page } from "@playwright/test";
import { blinks, drift } from "../support/frames.ts";
import { observe } from "../support/observe.ts";
import { openScene, wakeStage } from "../support/open.ts";
import { boxOf, focusedName, inside, overlap, pointAt } from "./below.ts";

/** The spoken names of these elements, in order. */
const namesOf = (l: Locator) => l.evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")));

/** Rafa on the stage, so Marina's preview has a sound to hear (her screen's). */
async function marinaSmall(page: Page) {
  await openScene(page, "s=live&sound=1");
  await page.getByRole("button", { name: "Watch Rafa · screen" }).click();
  await page.waitForTimeout(1500);
}

test("F-preview-row.1 pointing at a preview opens its row, the picture's width, beside it", async ({ page }, info) => {
  await openScene(page, "s=live");
  const rafa = page.getByRole("button", { name: "Watch Rafa · screen" });
  const row = page.getByRole("group", { name: "Rafa's sounds" });
  const seen = await observe(page, info, { rafa, row }, async () => {
    await pointAt(page, rafa);
    await page.waitForTimeout(500);
  });
  await expect.soft(row).toBeVisible();
  expect.soft(await namesOf(row.getByRole("button"))).toEqual(["Rafa: Rafa's mic is off", "Rafa: No screen sound"]);
  const p = await boxOf(rafa.locator("span").first());
  const r = await boxOf(row);
  expect.soft(Math.abs(r.width - p.width)).toBeLessThan(1);
  expect.soft(Math.abs(r.x - p.x)).toBeLessThan(1);
  expect.soft(overlap(r, p)).toBe(false);
  expect.soft(r.y + r.height <= p.y || r.y >= p.y + p.height).toBe(true);
  const window = { x: 0, y: 0, ...page.viewportSize()! };
  expect.soft(inside(window, r)).toBe(true);
  expect.soft(drift(seen.frames, "rafa")).toBeLessThan(1);
  expect.soft(blinks(seen.frames, "rafa")).toEqual([]);
});

test("F-preview-row.2 the row waits for the pointer on its way to it, and goes once it leaves both", async ({
  page,
}, info) => {
  await openScene(page, "s=live");
  const rafa = page.getByRole("button", { name: "Watch Rafa · screen" });
  const row = page.getByRole("group", { name: "Rafa's sounds" });
  await pointAt(page, rafa);
  await page.waitForTimeout(500);
  const seen = await observe(page, info, { row }, async () => {
    await pointAt(page, row);
    await page.waitForTimeout(500);
  });
  await expect.soft(row).toBeVisible();
  expect.soft(blinks(seen.frames, "row")).toEqual([]);
  expect.soft(drift(seen.frames, "row")).toBeLessThan(1);
  await page.mouse.move(10, 10, { steps: 4 });
  await page.waitForTimeout(900);
  await expect.soft(row).toHaveCount(0);
});

test("F-preview-row.3 a greyed sound says why on a click, and changes nothing", async ({ page }, info) => {
  await openScene(page, "s=live");
  const rafa = page.getByRole("button", { name: "Watch Rafa · screen" });
  await pointAt(page, rafa);
  await page.waitForTimeout(500);
  const mic = page.getByRole("button", { name: "Rafa: Rafa's mic is off" });
  const toast = page.getByRole("status").filter({ hasText: "Rafa's mic is off" });
  let said = false;
  const seen = await observe(page, info, { mic, toast }, async () => {
    // Greyed, not disabled: a click still lands (force: the test runner counts it as disabled).
    await mic.click({ force: true });
    // The toast lasts 3 s: checked as it shows, before the record's screenshots end.
    said = await toast.isVisible();
  });
  expect.soft(seen.before.toast?.present).toBe(false);
  expect.soft(said).toBe(true);
  await expect.soft(mic).toHaveAttribute("aria-disabled", "true");
  await expect.soft(mic).not.toHaveAttribute("aria-pressed");
  await expect.soft(page.getByRole("heading", { name: "Marina", level: 2 })).toBeVisible();
});

test("F-preview-row.4 resting on a sound unrolls its slider away from the preview, the buttons staying put", async ({
  page,
}, info) => {
  await marinaSmall(page);
  const marina = page.getByRole("button", { name: "Watch Marina · screen" });
  await pointAt(page, marina);
  await page.waitForTimeout(500);
  const row = page.getByRole("group", { name: "Marina's sounds" });
  const sound = row.getByRole("button", { name: "Unmute Marina's screen sound" });
  const voice = row.getByRole("button", { name: "Marina: Marina's mic is off" });
  const before = await boxOf(row);
  const seen = await observe(page, info, { row, sound, voice }, async () => {
    await pointAt(page, sound);
    await page.waitForTimeout(500);
  });
  const slider = row.getByRole("slider", { name: "Marina's screen sound volume" });
  await expect.soft(slider).toBeVisible();
  await expect.soft(slider).toHaveValue("1");
  const after = await boxOf(row);
  const p = await boxOf(marina.locator("span").first());
  expect.soft(after.x).toBeCloseTo(before.x, 0);
  expect.soft(after.width).toBeCloseTo(before.width, 0);
  expect.soft(after.height).toBeGreaterThan(before.height);
  // The side nearer the preview stays where it was: it grows away from it.
  const near = (b: typeof after) => (b.y >= p.y + p.height ? b.y : b.y + b.height);
  expect.soft(Math.abs(near(after) - near(before))).toBeLessThan(1);
  expect.soft(overlap(after, p)).toBe(false);
  expect.soft(drift(seen.frames, "sound")).toBeLessThan(1);
  expect.soft(drift(seen.frames, "voice")).toBeLessThan(1);
  expect.soft(blinks(seen.frames, "sound")).toEqual([]);
});

test("F-preview-row.5 Escape closes the row", async ({ page }, info) => {
  await openScene(page, "s=live");
  const rafa = page.getByRole("button", { name: "Watch Rafa · screen" });
  const row = page.getByRole("group", { name: "Rafa's sounds" });
  await pointAt(page, rafa);
  await page.waitForTimeout(500);
  await expect.soft(row).toBeVisible();
  const seen = await observe(page, info, { row, rafa }, async () => {
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
  });
  await expect.soft(row).toHaveCount(0);
  expect.soft(drift(seen.frames, "rafa")).toBeLessThan(1);
});

test("F-preview-row.6 by keyboard the row opens on the preview's focus and sits before the next preview", async ({
  page,
}, info) => {
  await openScene(page, "s=live");
  const rafa = page.getByRole("button", { name: "Watch Rafa · screen" });
  const row = page.getByRole("group", { name: "Rafa's sounds" });
  await observe(page, info, { rafa, row }, async () => {
    await rafa.focus();
    await page.waitForTimeout(500);
  });
  await expect.soft(row).toBeVisible();
  await page.keyboard.press("Tab");
  expect.soft(await focusedName(page)).toBe("Rafa: Rafa's mic is off");
  await page.keyboard.press("Tab");
  expect.soft(await focusedName(page)).toBe("Rafa: No screen sound");
  await page.keyboard.press("Tab");
  await page.waitForTimeout(500);
  expect.soft(await focusedName(page)).toBe("Watch Ana · camera");
  await expect.soft(page.getByRole("group", { name: "Ana's sounds" })).toBeVisible();
  await expect.soft(row).toHaveCount(0);
});

test("F-preview-row.7 pointing at another preview opens its row as the last one goes", async ({ page }, info) => {
  await openScene(page, "s=live");
  const rafa = page.getByRole("button", { name: "Watch Rafa · screen" });
  const ana = page.getByRole("button", { name: "Watch Ana · camera" });
  await pointAt(page, rafa);
  await page.waitForTimeout(500);
  const seen = await observe(
    page,
    info,
    { rafa, ana, rafaRow: page.getByRole("group", { name: "Rafa's sounds" }) },
    async () => {
      await pointAt(page, ana);
      await page.waitForTimeout(600);
    },
  );
  const anaRow = page.getByRole("group", { name: "Ana's sounds" });
  await expect.soft(anaRow).toBeVisible();
  await expect.soft(page.getByRole("group", { name: "Rafa's sounds" })).toHaveCount(0);
  await expect.soft(page.getByRole("group")).toHaveCount(1);
  const a = await boxOf(ana.locator("span").first());
  expect.soft(Math.abs((await boxOf(anaRow)).x - a.x)).toBeLessThan(1);
  expect.soft(drift(seen.frames, "rafa")).toBeLessThan(1);
  expect.soft(drift(seen.frames, "ana")).toBeLessThan(1);
});

test("F-preview-row.8 my own preview, sharing both, has only the swap, which trades its pictures", async ({
  page,
}, info) => {
  await openScene(page, "s=empty");
  await page.getByRole("button", { name: "Share your screen" }).click();
  await page.waitForTimeout(1500);
  await wakeStage(page);
  await page.getByRole("button", { name: "Turn on your camera" }).click();
  await page.waitForTimeout(1500);
  await page.evaluate(() => (window as unknown as { __xove: { marinaGoesLive: () => void } }).__xove.marinaGoesLive());
  await page.waitForTimeout(2500);
  await page.getByRole("button", { name: "Watch Marina · screen" }).click();
  await page.waitForTimeout(1500);
  const mine = page.getByRole("button", { name: "Watch You · screen" });
  await pointAt(page, mine);
  await page.waitForTimeout(500);
  const row = page.getByRole("group", { name: "Your stream" });
  expect.soft(await namesOf(row.getByRole("button"))).toEqual(["Swap your screen and camera"]);
  const swap = row.getByRole("button", { name: "Swap your screen and camera" });
  await expect.soft(swap).toHaveAttribute("aria-pressed", "false");
  const seen = await observe(page, info, { swap, row }, async () => {
    await swap.click();
    await page.waitForTimeout(500);
  });
  await expect.soft(swap).toHaveAttribute("aria-pressed", "true");
  await expect.soft(page.getByRole("button", { name: "Watch You · camera" })).toBeVisible();
  expect.soft(drift(seen.frames, "swap")).toBeLessThan(1);
  expect.soft(blinks(seen.frames, "swap")).toEqual([]);
});

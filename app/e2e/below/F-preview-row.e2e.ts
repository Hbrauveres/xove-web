import { expect, test, type Locator, type Page } from "@playwright/test";
import { blinks, drift } from "../support/frames.ts";
import { observe } from "../support/observe.ts";
import { boxOf, inside, overlap, windowBox, type Box } from "../support/geometry.ts";
import { marinaGoesLive } from "../support/harness.ts";
import { openScene, wakeStage } from "../support/open.ts";
import { pointAt } from "../support/pointer.ts";
import { untilStill } from "../support/timing.ts";
import { watch } from "./below.ts";

/** The spoken names of these elements, in order. */
const namesOf = (l: Locator) => l.evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")));

/** Rafa on the stage, so Marina's preview has a sound to hear (her screen's). */
async function marinaSmall(page: Page) {
  await openScene(page, "s=live&sound=1");
  await watch(page, "Rafa · screen");
}

/** Points at a preview and waits for its row to be open and still. */
async function openRow(page: Page, preview: Locator, row: Locator) {
  await pointAt(page, preview);
  await expect(row).toBeVisible();
  await untilStill(row);
}

test("F-preview-row.1 pointing at a preview opens its row, the picture's width, beside it", async ({ page }, info) => {
  await openScene(page, "s=live");
  const rafa = page.getByRole("button", { name: "Watch Rafa · screen" });
  const row = page.getByRole("group", { name: "Rafa's sounds" });
  const seen = await observe(page, info, { rafa, row }, () => openRow(page, rafa, row));
  await expect.soft(row).toBeVisible();
  expect.soft(await namesOf(row.getByRole("button"))).toEqual(["Rafa: Rafa's mic is off", "Rafa: No screen sound"]);
  const p = await boxOf(rafa.locator("span").first());
  const r = await boxOf(row);
  expect.soft(Math.abs(r.width - p.width)).toBeLessThan(1);
  expect.soft(Math.abs(r.x - p.x)).toBeLessThan(1);
  expect.soft(overlap(r, p)).toBe(false);
  expect.soft(r.y + r.height <= p.y || r.y >= p.y + p.height).toBe(true);
  expect.soft(inside(r, windowBox(page))).toBe(true);
  expect.soft(drift(seen.frames, "rafa")).toBeLessThan(1);
  expect.soft(blinks(seen.frames, "rafa")).toEqual([]);
});

test("F-preview-row.2 the row waits for the pointer on its way to it, and goes once it leaves both", async ({
  page,
}, info) => {
  await openScene(page, "s=live");
  const rafa = page.getByRole("button", { name: "Watch Rafa · screen" });
  const row = page.getByRole("group", { name: "Rafa's sounds" });
  await openRow(page, rafa, row);
  const seen = await observe(page, info, { row }, async () => {
    await pointAt(page, row);
  });
  await expect.soft(row).toBeVisible();
  expect.soft(blinks(seen.frames, "row")).toEqual([]);
  expect.soft(drift(seen.frames, "row")).toBeLessThan(1);
  await page.mouse.move(10, 10, { steps: 4 });
  await expect.soft(row).toHaveCount(0);
});

test("F-preview-row.3 a greyed sound says why on a click, and changes nothing", async ({ page }, info) => {
  await openScene(page, "s=live");
  const rafa = page.getByRole("button", { name: "Watch Rafa · screen" });
  await openRow(page, rafa, page.getByRole("group", { name: "Rafa's sounds" }));
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
  // Nothing to set for a mic that's off: no slider unrolls for it, or only a greyed one.
  const slider = page.getByRole("slider", { name: /Rafa/ });
  if ((await slider.count()) > 0 && (await slider.first().isVisible()))
    await expect.soft(slider.first()).toBeDisabled();
  await expect.soft(page.getByRole("heading", { name: "Marina", level: 2 })).toBeVisible();
});

test("F-preview-row.4 resting on a sound unrolls its slider away from the preview, the buttons staying put", async ({
  page,
}, info) => {
  await marinaSmall(page);
  const marina = page.getByRole("button", { name: "Watch Marina · screen" });
  const row = page.getByRole("group", { name: "Marina's sounds" });
  await openRow(page, marina, row);
  const sound = row.getByRole("button", { name: "Unmute Marina's screen sound" });
  const voice = row.getByRole("button", { name: "Marina: Marina's mic is off" });
  const before = await boxOf(row);
  const slider = row.getByRole("slider", { name: "Marina's screen sound volume" });
  const seen = await observe(page, info, { row, sound, voice }, async () => {
    await pointAt(page, sound);
    await expect(slider).toBeVisible();
  });
  await expect.soft(slider).toBeVisible();
  await expect.soft(slider).toHaveValue("1");
  const after = await boxOf(row);
  const p = await boxOf(marina.locator("span").first());
  expect.soft(after.x).toBeCloseTo(before.x, 0);
  expect.soft(after.width).toBeCloseTo(before.width, 0);
  expect.soft(after.height).toBeGreaterThan(before.height);
  // The side nearer the preview stays where it was: it grows away from it.
  const near = (b: Box) => (b.y >= p.y + p.height ? b.y : b.y + b.height);
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
  await openRow(page, rafa, row);
  const seen = await observe(page, info, { row, rafa }, async () => {
    await page.keyboard.press("Escape");
    await expect(row).toHaveCount(0);
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
    await expect(row).toBeVisible();
  });
  await expect.soft(row).toBeVisible();
  await page.keyboard.press("Tab");
  await expect.soft(row.getByRole("button", { name: "Rafa: Rafa's mic is off" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect.soft(row.getByRole("button", { name: "Rafa: No screen sound" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect.soft(page.getByRole("button", { name: "Watch Ana · camera" })).toBeFocused();
  await expect.soft(page.getByRole("group", { name: "Ana's sounds" })).toBeVisible();
  await expect.soft(row).toHaveCount(0);
});

test("F-preview-row.7 pointing at another preview opens its row as the last one goes", async ({ page }, info) => {
  await openScene(page, "s=live");
  const rafa = page.getByRole("button", { name: "Watch Rafa · screen" });
  const ana = page.getByRole("button", { name: "Watch Ana · camera" });
  const anaRow = page.getByRole("group", { name: "Ana's sounds" });
  await openRow(page, rafa, page.getByRole("group", { name: "Rafa's sounds" }));
  const seen = await observe(
    page,
    info,
    { rafa, ana, rafaRow: page.getByRole("group", { name: "Rafa's sounds" }) },
    () => openRow(page, ana, anaRow),
  );
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
  await page.getByRole("button", { name: "Stop sharing your screen" }).waitFor();
  await wakeStage(page);
  await page.getByRole("button", { name: "Turn on your camera" }).click();
  await page.getByRole("button", { name: "Turn off your camera" }).waitFor();
  await marinaGoesLive(page);
  await watch(page, "Marina · screen");
  const mine = page.getByRole("button", { name: "Watch You · screen" });
  const row = page.getByRole("group", { name: "Your stream" });
  await openRow(page, mine, row);
  expect.soft(await namesOf(row.getByRole("button"))).toEqual(["Swap your screen and camera"]);
  const swap = row.getByRole("button", { name: "Swap your screen and camera" });
  await expect.soft(swap).toHaveAttribute("aria-pressed", "false");
  const seen = await observe(page, info, { swap, row }, async () => {
    await swap.click();
    await expect(swap).toHaveAttribute("aria-pressed", "true");
  });
  await expect.soft(swap).toHaveAttribute("aria-pressed", "true");
  await expect.soft(page.getByRole("button", { name: "Watch You · camera" })).toBeVisible();
  expect.soft(drift(seen.frames, "swap")).toBeLessThan(1);
  expect.soft(blinks(seen.frames, "swap")).toEqual([]);
});

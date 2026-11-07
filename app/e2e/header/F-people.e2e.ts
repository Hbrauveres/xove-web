import { expect, test } from "@playwright/test";
import { blinks, drift } from "../support/frames.ts";
import { openScene } from "../support/open.ts";
import { observe } from "../support/observe.ts";
import { focusedName, headerOf, openFrom, peoplePanel, pointAt, pointAway, ROLL_WAIT, styleOf } from "./header.ts";

test("F-people.1 the button says how many are here, and brightens when pointed at", async ({ page }, info) => {
  await openScene(page, "s=live");
  const { people } = headerOf(page);
  await pointAway(page);
  const rest = await styleOf(people, "color");
  const seen = await observe(page, info, { people }, () => pointAt(page, people));
  await expect.soft(people).toHaveAccessibleName("4 people here");
  await expect.soft(people).toHaveText("4");
  await expect.soft(people).toHaveAttribute("aria-expanded", "false");
  expect.soft(await styleOf(people, "color")).not.toBe(rest);
  await expect.soft(peoplePanel(page)).toHaveCount(0);
  expect.soft(drift(seen.frames, "people")).toBeLessThan(1);
  expect.soft(blinks(seen.frames, "people")).toEqual([]);
});

test("F-people.2 a click opens Here now: the seats, their bar and the queue", async ({ page }, info) => {
  await openScene(page, "s=live");
  const { people } = headerOf(page);
  const panel = peoplePanel(page);
  const seen = await observe(page, info, { people, panel }, async () => {
    await people.click();
    await page.waitForTimeout(ROLL_WAIT);
  });
  await expect.soft(panel).toBeVisible();
  await expect.soft(panel.getByText("Seats", { exact: true })).toBeVisible();
  await expect.soft(panel.getByText("3 of 20 · 17 free")).toBeVisible();
  const bar = panel.getByRole("progressbar", { name: "Seats taken" });
  await expect.soft(bar).toHaveAttribute("value", "3");
  await expect.soft(bar).toHaveAttribute("max", "20");
  await expect.soft(panel.getByText("Nobody is waiting for a seat.")).toBeVisible();
  await expect.soft(people).toHaveAttribute("aria-expanded", "true");
  // 340 px wide, its right edge on the button's.
  const p = await panel.boundingBox();
  const b = await people.boundingBox();
  expect.soft(Math.round(p!.width)).toBe(340);
  expect.soft(Math.abs(p!.x + p!.width - (b!.x + b!.width))).toBeLessThan(1.5);
  expect.soft(drift(seen.frames, "people")).toBeLessThan(1);
  expect.soft(blinks(seen.frames, "people")).toEqual([]);
});

test("F-people.3 who's here: the sharers first, then me, each with what they do", async ({ page }, info) => {
  await openScene(page, "s=live");
  const { people } = headerOf(page);
  const panel = peoplePanel(page);
  await observe(page, info, { people, panel }, () => openFrom(page, people, panel));
  await expect
    .soft(panel.getByRole("listitem"))
    .toHaveText([
      /^Marina\s*Sharing their screen$/,
      /^Rafa\s*Sharing their screen$/,
      /^Ana\s*Sharing their camera$/,
      /^Henrique\s*\(you\)\s*Watching Marina$/,
    ]);
});

test("F-people.4 the list is only read: a person pointed at doesn't light up", async ({ page }, info) => {
  await openScene(page, "s=live");
  const { people } = headerOf(page);
  const panel = peoplePanel(page);
  await openFrom(page, people, panel);
  const row = panel.getByRole("listitem").first();
  const rest = await styleOf(row, "background-color");
  const seen = await observe(page, info, { row }, () => pointAt(page, row));
  expect.soft(await styleOf(row, "background-color")).toBe(rest);
  expect.soft(await styleOf(row, "cursor")).not.toBe("pointer");
  await expect.soft(panel.getByRole("button")).toHaveCount(0);
  expect.soft(blinks(seen.frames, "row")).toEqual([]);
});

test("F-people.5 when everyone stops, the lines say so", async ({ page }, info) => {
  await openScene(page, "s=live");
  const { people } = headerOf(page);
  const panel = peoplePanel(page);
  await page.evaluate(() => (window as unknown as { __xove: { everyoneStops: () => void } }).__xove.everyoneStops());
  await page.getByRole("button", { name: /^Activity: Ana turned off their camera/ }).waitFor();
  await page.waitForTimeout(300);
  await observe(page, info, { people, panel }, () => openFrom(page, people, panel));
  await expect.soft(panel.getByText(/^Sharing /)).toHaveCount(0);
  await expect.soft(panel.getByRole("listitem").filter({ hasText: "(you)" })).toBeVisible();
  // My own row comes first once nobody shares.
  await expect.soft(panel.getByRole("listitem").first()).toContainText("Henrique");
});

test("F-people.6 Escape closes it and the focus goes back to the button", async ({ page }, info) => {
  await openScene(page, "s=live");
  const { people } = headerOf(page);
  await people.focus();
  await page.keyboard.press("Enter");
  await peoplePanel(page).waitFor();
  await page.waitForTimeout(ROLL_WAIT);
  const seen = await observe(page, info, { people }, async () => {
    await page.keyboard.press("Escape");
    await page.waitForTimeout(ROLL_WAIT);
  });
  await expect.soft(peoplePanel(page)).toHaveCount(0);
  await expect.soft(people).toHaveAttribute("aria-expanded", "false");
  expect.soft(await focusedName(page)).toBe("4 people here");
  expect.soft(drift(seen.frames, "people")).toBeLessThan(1);
});

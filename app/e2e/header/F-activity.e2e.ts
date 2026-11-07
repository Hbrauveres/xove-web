import { expect, test } from "@playwright/test";
import { blinks, drift } from "../support/frames.ts";
import { openScene } from "../support/open.ts";
import { observe } from "../support/observe.ts";
import {
  activityList,
  everyoneStops,
  focusedName,
  headerOf,
  iShareMyScreen,
  marinaGoesLive,
  middleOf,
  openFrom,
  pointAt,
  pointAway,
  ROLL_WAIT,
  styleOf,
} from "./header.ts";

test("F-activity.1 at rest the pill shows the latest event, how long ago and how many are new", async ({
  page,
}, info) => {
  await openScene(page, "s=live");
  const { pill } = headerOf(page);
  const seen = await observe(page, info, { pill }, () => pointAway(page));
  await expect.soft(pill).toHaveAccessibleName("Activity: Ana joined, now, 3 new");
  await expect.soft(pill.getByText("Ana joined", { exact: true })).toBeVisible();
  await expect.soft(pill.locator("time")).toHaveText("now");
  await expect.soft(pill.getByText("3", { exact: true })).toBeVisible();
  await expect.soft(pill).toHaveAttribute("aria-expanded", "false");
  // 38 px tall, at most 440 px wide.
  const b = await pill.boundingBox();
  expect.soft(Math.round(b!.height)).toBe(38);
  expect.soft(b!.width).toBeLessThanOrEqual(440);
  expect.soft(blinks(seen.frames, "pill")).toEqual([]);
});

test("F-activity.2 pointed at, the pill's edge turns red and it stays put", async ({ page }, info) => {
  await openScene(page, "s=live");
  const { pill } = headerOf(page);
  const rest = await styleOf(pill, "border-color");
  const seen = await observe(page, info, { pill }, () => pointAt(page, pill));
  const hover = await styleOf(pill, "border-color");
  expect.soft(hover).not.toBe(rest);
  // The words and the count don't change on a hover.
  await expect.soft(pill).toHaveAccessibleName("Activity: Ana joined, now, 3 new");
  await expect.soft(activityList(page)).toHaveCount(0);
  expect.soft(drift(seen.frames, "pill")).toBeLessThan(1);
  expect.soft(blinks(seen.frames, "pill")).toEqual([]);
});

test("F-activity.3 a click opens the list, newest first, the new ones marked, the count gone", async ({
  page,
}, info) => {
  await openScene(page, "s=live");
  const { pill } = headerOf(page);
  const list = activityList(page);
  const seen = await observe(page, info, { pill, list }, async () => {
    await pill.click();
    await page.waitForTimeout(ROLL_WAIT);
  });
  await expect.soft(list).toBeVisible();
  await expect.soft(list.getByRole("listitem")).toHaveText([/Ana joined/, /Rafa joined/, /Marina joined/]);
  // The three new ones are marked while the list is open.
  await expect.soft(list.locator("[data-unseen]")).toHaveCount(3);
  await expect.soft(pill).toHaveAccessibleName("Activity: Ana joined, now");
  await expect.soft(pill).toHaveAttribute("aria-expanded", "true");
  expect.soft(await focusedName(page)).toBe("Activity");
  // Centred under the pill, at most 440 px wide.
  const p = await middleOf(pill);
  const l = await list.boundingBox();
  expect.soft(Math.abs(l!.x + l!.width / 2 - p.x)).toBeLessThan(1.5);
  expect.soft(l!.width).toBeLessThanOrEqual(440);
  expect.soft(drift(seen.frames, "pill")).toBeLessThan(1);
  expect.soft(blinks(seen.frames, "pill")).toEqual([]);
});

test("F-activity.4 closing the list counts everything seen", async ({ page }, info) => {
  await openScene(page, "s=live");
  const { pill } = headerOf(page);
  await openFrom(page, pill, activityList(page));
  const seen = await observe(page, info, { pill }, async () => {
    await page.keyboard.press("Escape");
    await page.waitForTimeout(ROLL_WAIT);
  });
  await expect.soft(activityList(page)).toHaveCount(0);
  await expect.soft(pill).toHaveAccessibleName("Activity: Ana joined, now");
  expect.soft(await focusedName(page)).toBe("Activity: Ana joined, now");
  // Opened again, nothing is marked new.
  await openFrom(page, pill, activityList(page));
  await expect.soft(activityList(page).locator("[data-unseen]")).toHaveCount(0);
  expect.soft(blinks(seen.frames, "pill")).toEqual([]);
});

test("F-activity.5 a new event slides into the pill and is counted, the pill staying put", async ({ page }, info) => {
  await openScene(page, "s=live");
  const h = headerOf(page);
  const seen = await observe(page, info, { pill: h.pill, people: h.people, me: h.me }, () => everyoneStops(page), {
    strip: 10,
    gap: 60,
  });
  // Three streams stopped: three more events, the latest in the pill.
  await expect.soft(h.pill).toHaveAccessibleName("Activity: Ana turned off their camera, now, 6 new");
  await expect.soft(h.pill.getByText("6", { exact: true })).toBeVisible();
  for (const n of ["pill", "people", "me"]) {
    expect.soft(drift(seen.frames, n)).toBeLessThan(1);
    expect.soft(blinks(seen.frames, n)).toEqual([]);
  }
  // The pill keeps its width whatever the words.
  const widths = seen.frames.map((f) => f.seen.pill?.box?.w ?? 0);
  expect.soft(Math.max(...widths) - Math.min(...widths)).toBeLessThan(1);
});

test("F-activity.6 streams stopping and starting read in plain words", async ({ page }, info) => {
  await openScene(page, "s=live");
  const { pill } = headerOf(page);
  await everyoneStops(page);
  await marinaGoesLive(page);
  const list = activityList(page);
  await observe(page, info, { pill, list }, () => openFrom(page, pill, list));
  await expect
    .soft(list.getByRole("listitem"))
    .toHaveText([
      /Marina started sharing/,
      /Ana turned off their camera/,
      /Rafa stopped sharing/,
      /Marina stopped sharing/,
      /Ana joined/,
      /Rafa joined/,
      /Marina joined/,
    ]);
  // Marina's start is live and on my stage: a button marked WATCHING.
  const marina = list.getByRole("button", { name: "Marina started sharing: watching" });
  await expect.soft(marina).toBeVisible();
  await expect.soft(marina.getByText("WATCHING", { exact: true })).toBeVisible();
  // The stops aren't buttons: there's nothing to watch.
  await expect.soft(list.getByRole("button")).toHaveCount(1);
});

test("F-activity.7 a live stream's event shows WATCH when pointed at, and a click puts it on the stage", async ({
  page,
}, info) => {
  await openScene(page, "s=live");
  const { pill } = headerOf(page);
  await everyoneStops(page);
  await marinaGoesLive(page);
  await iShareMyScreen(page);
  await expect.soft(page.getByRole("heading", { level: 2, name: "You" })).toBeVisible();
  const list = activityList(page);
  await openFrom(page, pill, list);
  const row = list.getByRole("button", { name: "Marina started sharing, now: watch" });
  const watch = row.getByText("WATCH", { exact: true });
  await expect.soft(watch).toBeHidden();
  await pointAt(page, row);
  await expect.soft(watch).toBeVisible();
  await expect.soft(row.locator("time")).toBeHidden();
  const seen = await observe(page, info, { pill, row }, async () => {
    await row.click();
    await page.waitForTimeout(ROLL_WAIT);
  });
  await expect.soft(page.getByRole("heading", { level: 2, name: "Marina" })).toBeVisible();
  // The list closes; the keyboard stays on the pill.
  await expect.soft(list).toHaveCount(0);
  expect.soft(await focusedName(page)).toMatch(/^Activity: /);
  expect.soft(drift(seen.frames, "pill")).toBeLessThan(1);
});

test("F-activity.8 an event that can't be watched is only read: no button, no hover", async ({ page }, info) => {
  await openScene(page, "s=live");
  const { pill } = headerOf(page);
  const list = activityList(page);
  await openFrom(page, pill, list);
  // Closed and opened again, so no row is marked new.
  await page.keyboard.press("Escape");
  await page.waitForTimeout(ROLL_WAIT);
  await openFrom(page, pill, list);
  const row = list.getByRole("listitem").filter({ hasText: "Rafa joined" }).locator("> div");
  const rest = await styleOf(row, "background-color");
  const seen = await observe(page, info, { row }, () => pointAt(page, row));
  await expect.soft(list.getByRole("button")).toHaveCount(0);
  expect.soft(await styleOf(row, "background-color")).toBe(rest);
  expect.soft(await styleOf(row, "cursor")).not.toBe("pointer");
  await expect.soft(list).toBeVisible();
  expect.soft(blinks(seen.frames, "row")).toEqual([]);
});

import { expect, test } from "@playwright/test";
import { blinks, drift } from "../support/frames.ts";
import { observe } from "../support/observe.ts";
import { boxOf, inside, overlap, windowBox } from "../support/geometry.ts";
import { everyoneStops, marinaGoesLive } from "../support/harness.ts";
import { openScene, wakeStage } from "../support/open.ts";
import { REPORT_STILL_MS } from "../../src/features/room/constants/watch-report.constants.ts";
import { AFTER_POLL, roomOf } from "./room.ts";

test("F-room.1 the room fills the window: header, stage and footer, nothing to scroll", async ({ page }, info) => {
  await openScene(page, "s=live");
  const { header, middle, stage, footer } = roomOf(page);
  await observe(page, info, { header, stage, footer }, () => wakeStage(page));
  const win = windowBox(page);
  const [h, m, s, f] = await Promise.all([boxOf(header), boxOf(middle), boxOf(stage), boxOf(footer)]);
  expect.soft(Math.abs(h.y)).toBeLessThan(1);
  expect.soft(Math.abs(f.y + f.height - win.height)).toBeLessThan(1);
  expect.soft(h.y + h.height).toBeLessThanOrEqual(m.y + 0.5);
  expect.soft(m.y + m.height).toBeLessThanOrEqual(f.y + 0.5);
  expect.soft(inside(s, m)).toBe(true);
  expect.soft(overlap(h, f)).toBe(false);
  const scroll = await page.evaluate(() => ({
    down: document.documentElement.scrollHeight - window.innerHeight,
    across: document.documentElement.scrollWidth - window.innerWidth,
  }));
  expect.soft(scroll.down).toBeLessThanOrEqual(0);
  expect.soft(scroll.across).toBeLessThanOrEqual(0);
});

test("F-room.2 with a seat, the room opens straight away, never the queue", async ({ page }, info) => {
  await openScene(page, "s=empty");
  const { stage } = roomOf(page);
  const full = page.getByRole("heading", { name: "The room is full" });
  await observe(page, info, { stage, full }, () => wakeStage(page));
  await expect.soft(stage).toBeVisible();
  await expect.soft(page.getByRole("heading", { name: "Nobody is sharing yet" })).toBeVisible();
  await expect.soft(page.getByText("Marina and Rafa are here.")).toBeVisible();
  await expect.soft(full).toHaveCount(0);
  await expect.soft(page.getByText("Looking for a seat…")).toHaveCount(0);
  await expect.soft(page.getByRole("button", { name: "3 people here" })).toBeVisible();
});

test("F-room.3 someone going live appears on the stage by itself, the page around it still", async ({ page }, info) => {
  await openScene(page, "s=empty");
  const { header, stage, footer } = roomOf(page);
  const video = stage.getByLabel("Marina's shared screen");
  const seen = await observe(page, info, { header, footer, video }, async () => {
    await marinaGoesLive(page);
    await expect(video).toBeVisible(AFTER_POLL);
  });
  await expect.soft(video).toBeVisible();
  await expect.soft(stage.getByRole("heading", { name: "Marina", level: 2 })).toBeVisible();
  await expect.soft(page.getByRole("figure", { name: "1 of 6 live, 5 seats open" })).toBeVisible();
  await expect.soft(page.getByRole("heading", { name: "Nobody is sharing yet" })).toHaveCount(0);
  for (const part of ["header", "footer"]) {
    expect.soft(drift(seen.frames, part)).toBeLessThan(1);
    expect.soft(blinks(seen.frames, part)).toEqual([]);
  }
});

test("F-room.4 everyone stopping empties the stage by itself, the page around it still", async ({ page }, info) => {
  await openScene(page, "s=live");
  await wakeStage(page);
  const { header, stage, footer } = roomOf(page);
  const nobody = page.getByRole("heading", { name: "Nobody is sharing yet" });
  const seen = await observe(page, info, { header, footer, nobody }, async () => {
    await everyoneStops(page);
    await expect(nobody).toBeVisible(AFTER_POLL);
  });
  await expect.soft(nobody).toBeVisible();
  await expect.soft(stage.locator("video")).toHaveCount(0);
  await expect.soft(page.getByRole("figure", { name: "0 of 6 live, 6 seats open" })).toBeVisible();
  await expect.soft(page.getByRole("button", { name: /^Watch / })).toHaveCount(0);
  for (const part of ["header", "footer"]) {
    expect.soft(drift(seen.frames, part)).toBeLessThan(1);
    expect.soft(blinks(seen.frames, part)).toEqual([]);
  }
});

test("F-room.5 what I watch is told to the room: my face joins its watchers", async ({ page }, info) => {
  await openScene(page, "s=live");
  const { stage } = roomOf(page);
  const watch = page.getByRole("button", { name: "Watch Rafa · screen" });
  const row = stage.getByRole("paragraph").filter({ hasText: "LIVE" });
  await observe(page, info, { watch, row }, async () => {
    await watch.click();
    await expect(stage.getByLabel("Rafa's shared screen")).toBeVisible();
  });
  await expect.soft(stage.getByRole("heading", { name: "Rafa", level: 2 })).toBeVisible();
  // Reported after a second of stillness, then back with the next poll (2 s): I'm Rafa's one watcher.
  await expect.soft(row).toContainText("1 watching", { timeout: AFTER_POLL.timeout + REPORT_STILL_MS });
  await expect.soft(row.getByText("3 watching")).toHaveCount(0);
});

test("F-room.6 my own screen goes live and is counted by the room, and stops the same way", async ({ page }, info) => {
  await openScene(page, "s=empty");
  const { stage } = roomOf(page);
  const share = page.getByRole("button", { name: "Share your screen" });
  const mine = stage.getByLabel("Your shared screen");
  await observe(page, info, { share, mine }, async () => {
    await share.click();
    await expect(mine).toBeVisible(AFTER_POLL);
  });
  await expect.soft(mine).toBeVisible();
  await expect.soft(page.getByRole("figure", { name: "1 of 6 live, 5 seats open" })).toBeVisible(AFTER_POLL);
  await wakeStage(page);
  await page.getByRole("button", { name: "Stop sharing your screen" }).click();
  await expect.soft(mine).toHaveCount(0, AFTER_POLL);
  await expect.soft(page.getByRole("figure", { name: "0 of 6 live, 6 seats open" })).toBeVisible(AFTER_POLL);
  await expect.soft(page.getByRole("heading", { name: "Nobody is sharing yet" })).toBeVisible();
});

import { expect, test, type Page } from "@playwright/test";
import { blinks, drift } from "../support/frames.ts";
import { observe } from "../support/observe.ts";
import { boxOf, inside, windowBox } from "../support/geometry.ts";
import { pxOf } from "../support/looks.ts";
import { openScene } from "../support/open.ts";
import { untilStill } from "../support/timing.ts";
import { AFTER_POLL, OFFER, answerSeat, clockAt } from "./room.ts";

/** How far the clock moves on while the seconds are watched (ms), and past the whole offer. */
const LATER_MS = 3000;
const PAST_IT_MS = 75_000;
/** Long enough for the seconds on screen to catch up with the clock. */
const TICKED = { timeout: 2000 };

const QUEUE = "s=live&page=waiting";
const TEXT =
  "A seat in the room is free for you. Enter within 60 seconds, or it goes to the next person and you go to the end of the line.";

const dialogOf = (page: Page) => page.getByRole("dialog", { name: "It's your turn" });

/** In the queue, then a seat frees for me. */
async function offered(page: Page) {
  await openScene(page, QUEUE);
  await answerSeat(page, OFFER);
  await dialogOf(page).waitFor(AFTER_POLL);
  await untilStill(page);
}

test("F-seat-offer.1 a seat frees: a dialog offers it for 60 seconds, Enter room focused", async ({ page }, info) => {
  await openScene(page, QUEUE);
  const dialog = dialogOf(page);
  await observe(page, info, { dialog }, async () => {
    await answerSeat(page, OFFER);
    await dialog.waitFor(AFTER_POLL);
  });
  await expect.soft(dialog).toBeVisible();
  await expect.soft(dialog).toHaveAttribute("aria-modal", "true");
  await expect.soft(dialog).toContainText(TEXT);
  await expect.soft(dialog.getByRole("button", { name: "Enter room" })).toBeFocused();
  await expect.soft(dialog.getByRole("button", { name: "Cancel" })).toBeVisible();
  await expect.soft(page).toHaveTitle("Your turn — Xovê");
  const box = await boxOf(dialog);
  expect.soft(inside(box, windowBox(page))).toBe(true);
  expect.soft(box.width).toBeLessThanOrEqual((await pxOf(page, "var(--seat-offer-width)")) + 0.5);
});

test("F-seat-offer.2 the seconds run down, the dialog still", async ({ page }, info) => {
  await offered(page);
  const dialog = dialogOf(page);
  const seconds = dialog.getByText(/^\d+ seconds$/);
  await expect.soft(seconds).toHaveText("60 seconds");
  const seen = await observe(page, info, { dialog, seconds }, async () => {
    await clockAt(page, LATER_MS);
    await expect(seconds).toHaveText("57 seconds", TICKED);
  });
  await expect.soft(seconds).toHaveText("57 seconds");
  // Never below nothing: past the time it says 0.
  await clockAt(page, PAST_IT_MS);
  await expect.soft(seconds).toHaveText("0 seconds", TICKED);
  expect.soft(drift(seen.frames, "dialog")).toBeLessThan(1);
  expect.soft(blinks(seen.frames, "dialog")).toEqual([]);
});

test("F-seat-offer.3 Tab stays inside the dialog, between its two buttons", async ({ page }, info) => {
  await offered(page);
  const dialog = dialogOf(page);
  const enter = dialog.getByRole("button", { name: "Enter room" });
  const cancel = dialog.getByRole("button", { name: "Cancel" });
  await observe(page, info, { enter, cancel }, async () => {
    await page.keyboard.press("Tab");
  });
  await expect.soft(cancel).toBeFocused();
  await page.keyboard.press("Tab");
  await expect.soft(enter).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect.soft(cancel).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect.soft(enter).toBeFocused();
});

test("F-seat-offer.4 Enter room takes the seat: the room opens, the tab's title back", async ({ page }, info) => {
  await offered(page);
  const dialog = dialogOf(page);
  const enter = dialog.getByRole("button", { name: "Enter room" });
  await observe(page, info, { dialog, enter }, async () => {
    await enter.click();
  });
  await expect.soft(page.getByRole("region", { name: "Shared screen" })).toBeVisible(AFTER_POLL);
  await expect.soft(page.getByLabel("Marina's shared screen")).toBeVisible(AFTER_POLL);
  await expect.soft(dialog).toHaveCount(0);
  await expect.soft(page).not.toHaveTitle("Your turn — Xovê");
});

test("F-seat-offer.5 Cancel gives the seat up: I've left the queue", async ({ page }, info) => {
  await offered(page);
  const dialog = dialogOf(page);
  const cancel = dialog.getByRole("button", { name: "Cancel" });
  await observe(page, info, { dialog, cancel }, async () => {
    await cancel.click();
  });
  await expect.soft(dialog).toHaveCount(0);
  await expect.soft(page.getByRole("heading", { name: "You left the queue" })).toBeVisible();
  await expect.soft(page.getByRole("region", { name: "Shared screen" })).toHaveCount(0);
  await expect.soft(page).not.toHaveTitle("Your turn — Xovê");
});

test("F-seat-offer.6 Escape is Cancel", async ({ page }, info) => {
  await offered(page);
  const dialog = dialogOf(page);
  await observe(page, info, { dialog }, async () => {
    await page.keyboard.press("Escape");
  });
  await expect.soft(dialog).toHaveCount(0);
  await expect.soft(page.getByRole("heading", { name: "You left the queue" })).toBeVisible();
  await expect.soft(page.getByRole("button", { name: "Join the queue again" })).toBeVisible();
});

import { expect, test } from "@playwright/test";
import { blinks, drift } from "../support/frames.ts";
import { observe } from "../support/observe.ts";
import { openScene } from "../support/open.ts";
import { OFFER, answerSeat, boxOf, centreX, inside, pointAt, windowBox } from "./room.ts";

const QUEUE = "s=live&page=waiting";

test("F-waiting-room.1 the room full: my place in plain words, on a card in the window's middle", async ({
  page,
}, info) => {
  await openScene(page, QUEUE);
  const card = page.getByRole("status").filter({ has: page.getByRole("heading", { name: "The room is full" }) });
  const heading = page.getByRole("heading", { name: "The room is full", level: 1 });
  await observe(page, info, { card, heading }, () => page.mouse.move(10, 10));
  await expect.soft(heading).toBeVisible();
  await expect
    .soft(card)
    .toContainText("You're number 2 in line. Keep this page open: when a seat frees, a popup asks you to enter.");
  await expect.soft(card).toHaveAttribute("aria-live", "polite");
  const box = await boxOf(card);
  expect.soft(inside(windowBox(page), box)).toBe(true);
  expect.soft(Math.abs(centreX(box) - windowBox(page).width / 2)).toBeLessThan(1);
  // Nothing of the room while waiting: no stage, no header, no footer.
  await expect.soft(page.getByRole("region", { name: "Shared screen" })).toHaveCount(0);
  await expect.soft(page.getByRole("banner")).toHaveCount(0);
  await expect.soft(page.getByRole("contentinfo")).toHaveCount(0);
});

test("F-waiting-room.2 moving up to first: the words change by themselves, the card still", async ({ page }, info) => {
  await openScene(page, QUEUE);
  const card = page.getByRole("status").filter({ has: page.getByRole("heading", { name: "The room is full" }) });
  const heading = page.getByRole("heading", { name: "The room is full" });
  const seen = await observe(page, info, { card, heading }, async () => {
    await answerSeat(page, { status: "waiting", place: 1 });
    await expect(card).toContainText("You're next in line.", { timeout: 4000 });
  });
  await expect
    .soft(card)
    .toContainText("You're next in line. Keep this page open: when a seat frees, a popup asks you to enter.");
  await expect.soft(card.getByText("number 2")).toHaveCount(0);
  expect.soft(blinks(seen.frames, "heading")).toEqual([]);
  expect.soft(drift(seen.frames, "heading")).toBeLessThan(1);
});

test("F-waiting-room.3 the API out of reach: it says so and keeps trying, my place kept", async ({ page }, info) => {
  await openScene(page, QUEUE);
  const card = page.getByRole("status").filter({ has: page.getByRole("heading", { name: "The room is full" }) });
  const error = page.getByText("Couldn't reach the room. Trying again…");
  await observe(page, info, { card, error }, async () => {
    await answerSeat(page, "down");
    await expect(error).toBeVisible({ timeout: 4000 });
  });
  await expect.soft(error).toBeVisible();
  await expect.soft(card).toContainText("You're number 2 in line.");
  // Back on its feet: the next poll clears the message.
  await answerSeat(page, { status: "waiting", place: 2 });
  await expect.soft(error).toHaveCount(0, { timeout: 4000 });
});

test("F-waiting-room.4 after leaving the queue, one button joins it again", async ({ page }, info) => {
  await openScene(page, QUEUE);
  await answerSeat(page, OFFER);
  await page.getByRole("dialog", { name: "It's your turn" }).waitFor({ timeout: 4000 });
  await page.getByRole("button", { name: "Cancel" }).click();
  await answerSeat(page, { status: "waiting", place: 4 });
  const left = page.getByRole("heading", { name: "You left the queue" });
  const again = page.getByRole("button", { name: "Join the queue again" });
  await expect.soft(left).toBeVisible();
  await expect.soft(page.getByText("Join it again whenever you like: you'll go to the end of the line.")).toBeVisible();
  await observe(page, info, { left, again }, async () => {
    await again.click();
  });
  await expect.soft(page.getByRole("heading", { name: "The room is full" })).toBeVisible({ timeout: 4000 });
  await expect.soft(page.getByText("You're number 4 in line.", { exact: false })).toBeVisible();
  await expect.soft(left).toHaveCount(0);
});

test("F-waiting-room.5 Sign out, under the card, takes me to the sign-in page", async ({ page }, info) => {
  await openScene(page, QUEUE);
  const signOut = page.getByRole("button", { name: "Sign out" });
  const card = page.getByRole("status").filter({ has: page.getByRole("heading", { name: "The room is full" }) });
  await expect.soft(signOut).toBeInViewport({ ratio: 1 });
  const c = await boxOf(card);
  const s = await boxOf(signOut);
  expect.soft(s.y).toBeGreaterThanOrEqual(c.y + c.height);
  await observe(page, info, { signOut }, async () => {
    await pointAt(page, signOut);
    await signOut.click();
  });
  await expect.soft(page.getByRole("link", { name: "Continue with Google" })).toBeVisible({ timeout: 4000 });
  await expect.soft(page.getByRole("heading", { name: "The room is full" })).toHaveCount(0);
});

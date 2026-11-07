import { expect, test, type Page } from "@playwright/test";
import { blinks } from "../support/frames.ts";
import { observe } from "../support/observe.ts";
import { openScene } from "../support/open.ts";
import { boxOf, centreY, inside, pointAt, roomOf, windowBox } from "./room.ts";

const partsOf = (page: Page) => {
  const footer = roomOf(page).footer;
  return {
    footer,
    made: footer.getByText("xovê · Made by Hbrauveres"),
    coffee: footer.getByText("☕ Buy me a coffee"),
    github: footer.getByText("GitHub", { exact: true }),
    linkedin: footer.getByText("LinkedIn", { exact: true }),
  };
};

test("F-room-footer.1 one line: who made it at the left, the coffee and the links at the right", async ({
  page,
}, info) => {
  await openScene(page, "s=live");
  const parts = partsOf(page);
  await observe(page, info, parts, () => page.mouse.move(10, 10));
  const win = windowBox(page);
  const boxes = await Promise.all([parts.made, parts.coffee, parts.github, parts.linkedin].map((l) => boxOf(l)));
  const footer = await boxOf(parts.footer);
  const [made, coffee, github, linkedin] = boxes as [
    (typeof boxes)[0],
    (typeof boxes)[0],
    (typeof boxes)[0],
    (typeof boxes)[0],
  ];
  for (const b of boxes) {
    expect.soft(inside(win, b)).toBe(true);
    expect.soft(inside(footer, b)).toBe(true);
    // Level with each other: one line.
    expect.soft(Math.abs(centreY(b) - centreY(made))).toBeLessThan(1.5);
  }
  expect.soft(made.x + made.width).toBeLessThan(coffee.x);
  expect.soft(coffee.x + coffee.width).toBeLessThan(github.x);
  expect.soft(github.x + github.width).toBeLessThan(linkedin.x);
  // The left text starts where the right ends, mirrored: the same edges.
  expect.soft(Math.abs(made.x - footer.x - (footer.x + footer.width - linkedin.x - linkedin.width))).toBeLessThan(1);
});

test("F-room-footer.2 Buy me a coffee is white, the rest muted", async ({ page }, info) => {
  await openScene(page, "s=live");
  const parts = partsOf(page);
  const seen = await observe(page, info, parts, () => page.mouse.move(10, 10));
  const colour = (name: keyof typeof parts) => seen.after[name]?.look?.color;
  expect.soft(colour("coffee")).not.toEqual(colour("github"));
  expect.soft(colour("github")).toEqual(colour("linkedin"));
  expect.soft(colour("made")).toEqual(colour("github"));
  // White: each channel near the top.
  const rgb = (colour("coffee") ?? "").match(/\d+/g)?.slice(0, 3).map(Number) ?? [];
  for (const c of rgb) expect.soft(c).toBeGreaterThan(220);
});

test("F-room-footer.3 not clickable yet: no links, and pointing changes nothing", async ({ page }, info) => {
  await openScene(page, "s=live");
  const parts = partsOf(page);
  const seen = await observe(page, info, parts, async () => {
    await pointAt(page, parts.github);
    await page.waitForTimeout(200);
  });
  await expect.soft(parts.footer.getByRole("link")).toHaveCount(0);
  await expect.soft(parts.footer.getByRole("button")).toHaveCount(0);
  expect.soft(seen.after.github?.look).toEqual(seen.before.github?.look);
  expect.soft(await page.locator('[role="tooltip"][data-shown]').count()).toBe(0);
  expect.soft(blinks(seen.frames, "github")).toEqual([]);
});

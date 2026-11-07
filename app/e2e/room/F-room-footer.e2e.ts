import { expect, test, type Page } from "@playwright/test";
import { blinks } from "../support/frames.ts";
import { observe } from "../support/observe.ts";
import { boxOf, centreY, inside, windowBox } from "../support/geometry.ts";
import { computed, LOOK } from "../support/looks.ts";
import { openScene } from "../support/open.ts";
import { restOn } from "../support/pointer.ts";
import { shownTip } from "../support/stage.ts";
import { TIP_REST_MS } from "../support/timing.ts";
import { roomOf } from "./room.ts";

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
    expect.soft(inside(b, win)).toBe(true);
    expect.soft(inside(b, footer)).toBe(true);
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
  // White: the app's text colour; the rest its muted one.
  const white = await computed(page, "color", LOOK.text);
  const muted = await computed(page, "color", LOOK.muted);
  expect.soft(colour("coffee")).toEqual(white);
  expect.soft(colour("coffee")).not.toEqual(colour("github"));
  for (const name of ["made", "github", "linkedin"] as const) expect.soft(colour(name)).toEqual(muted);
});

test("F-room-footer.3 not clickable yet: no links, and pointing changes nothing", async ({ page }, info) => {
  await openScene(page, "s=live");
  const parts = partsOf(page);
  const seen = await observe(page, info, parts, async () => {
    // As long as a tooltip's rest: one would show by now.
    await restOn(page, parts.github, TIP_REST_MS);
  });
  await expect.soft(parts.footer.getByRole("link")).toHaveCount(0);
  await expect.soft(parts.footer.getByRole("button")).toHaveCount(0);
  expect.soft(seen.after.github?.look).toEqual(seen.before.github?.look);
  await expect.soft(shownTip(page)).toHaveCount(0);
  expect.soft(blinks(seen.frames, "github")).toEqual([]);
});

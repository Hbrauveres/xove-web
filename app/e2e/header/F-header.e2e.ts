import { expect, test } from "@playwright/test";
import { blinks, drift } from "../support/frames.ts";
import { openScene, wakeStage } from "../support/open.ts";
import { observe } from "../support/observe.ts";
import {
  activityList,
  focusedName,
  headerOf,
  inside,
  middleOf,
  myMenu,
  onTop,
  openFrom,
  peoplePanel,
  pointAway,
  ROLL_WAIT,
  styleOf,
} from "./header.ts";

test("F-header.1 the bar: the wordmark left, the activity in the middle, people and me at the right", async ({
  page,
}, info) => {
  await openScene(page, "s=live");
  const h = headerOf(page);
  const seen = await observe(page, info, { wordmark: h.wordmark, pill: h.pill, people: h.people, me: h.me }, () =>
    pointAway(page),
  );
  for (const el of [h.wordmark, h.pill, h.people, h.me]) {
    await expect.soft(el).toBeVisible();
    expect.soft(await inside(page, el)).toBe(true);
  }
  const [w, p, pe, me] = await Promise.all([h.wordmark, h.pill, h.people, h.me].map(middleOf));
  const width = page.viewportSize()!.width;
  // Left, centre, right, in that order, all on one line.
  expect.soft(w!.x).toBeLessThan(width / 3);
  expect.soft(Math.abs(p!.x - width / 2)).toBeLessThan(width * 0.1);
  expect.soft(pe!.x).toBeGreaterThan((width * 2) / 3);
  expect.soft(me!.x).toBeGreaterThan(pe!.x);
  for (const m of [p, pe, me]) expect.soft(Math.abs(m!.y - w!.y)).toBeLessThan(2);
  // At the top of the room, above the stage.
  const bar = await h.bar.boundingBox();
  const stage = await page.getByRole("region", { name: "Shared screen" }).boundingBox();
  expect.soft(bar!.y).toBeLessThan(1);
  expect.soft(bar!.y + bar!.height).toBeLessThanOrEqual(stage!.y + 1);
  for (const n of ["wordmark", "pill", "people", "me"]) expect.soft(blinks(seen.frames, n)).toEqual([]);
});

test("F-header.2 the bar is see-through and nothing covers its buttons", async ({ page }, info) => {
  await openScene(page, "s=live");
  const h = headerOf(page);
  await observe(page, info, { bar: h.bar, pill: h.pill, people: h.people, me: h.me }, () => pointAway(page));
  expect.soft(await styleOf(h.bar, "background-color")).toBe("rgba(0, 0, 0, 0)");
  for (const el of [h.pill, h.people, h.me]) expect.soft(await onTop(el)).toBe(true);
});

test("F-header.3 the stage's controls waking doesn't move the bar", async ({ page }, info) => {
  await openScene(page, "s=live");
  const h = headerOf(page);
  const seen = await observe(page, info, { wordmark: h.wordmark, pill: h.pill, people: h.people, me: h.me }, () =>
    wakeStage(page),
  );
  for (const n of ["wordmark", "pill", "people", "me"]) {
    expect.soft(drift(seen.frames, n)).toBeLessThan(1);
    expect.soft(blinks(seen.frames, n)).toEqual([]);
  }
});

test("F-header.4 Tab goes pill, people, me, each with the red ring; the wordmark isn't a stop", async ({
  page,
}, info) => {
  await openScene(page, "s=live");
  const h = headerOf(page);
  const order: string[] = [];
  const rings: string[] = [];
  await observe(page, info, { pill: h.pill, people: h.people, me: h.me }, async () => {
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press("Tab");
      order.push(await focusedName(page));
      rings.push(
        await page.evaluate(() => {
          const s = getComputedStyle(document.activeElement!);
          return `${s.outlineStyle} ${s.outlineColor}`;
        }),
      );
    }
  });
  expect.soft(order[0]).toMatch(/^Activity: /);
  expect.soft(order[1]).toBe("4 people here");
  expect.soft(order[2]).toBe("Henrique: account, connected");
  for (const r of rings) expect.soft(r).toBe("solid rgb(239, 75, 75)");
});

test("F-header.5 each panel opens 8 px under its button, inside the window, over the stage", async ({ page }, info) => {
  await openScene(page, "s=live");
  const h = headerOf(page);
  for (const [button, panel] of [
    [h.pill, activityList(page)],
    [h.people, peoplePanel(page)],
    [h.me, myMenu(page)],
  ] as const) {
    const seen = await observe(page, info, { button, panel }, () => openFrom(page, button, panel));
    const b = await button.boundingBox();
    const p = await panel.boundingBox();
    expect.soft(Math.abs(p!.y - (b!.y + b!.height) - 8)).toBeLessThan(1.5);
    expect.soft(await inside(page, panel)).toBe(true);
    expect.soft(await onTop(panel)).toBe(true);
    await expect.soft(button).toHaveAttribute("aria-expanded", "true");
    expect.soft(drift(seen.frames, "button")).toBeLessThan(1);
    expect.soft(blinks(seen.frames, "button")).toEqual([]);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(ROLL_WAIT);
  }
});

test("F-header.6 one panel at a time: opening another closes the one open", async ({ page }, info) => {
  await openScene(page, "s=live");
  const h = headerOf(page);
  await openFrom(page, h.pill, activityList(page));
  const seen = await observe(page, info, { pill: h.pill, people: h.people }, async () => {
    await h.people.click();
    await page.waitForTimeout(ROLL_WAIT);
  });
  await expect.soft(peoplePanel(page)).toBeVisible();
  await expect.soft(activityList(page)).toHaveCount(0);
  await expect.soft(h.pill).toHaveAttribute("aria-expanded", "false");
  await h.me.click();
  await page.waitForTimeout(ROLL_WAIT);
  await expect.soft(myMenu(page)).toBeVisible();
  await expect.soft(peoplePanel(page)).toHaveCount(0);
  await expect.soft(page.getByRole("dialog")).toHaveCount(1);
  expect.soft(drift(seen.frames, "people")).toBeLessThan(1);
});

test("F-header.7 Escape closes a panel and gives the focus back to its button; a press outside closes it", async ({
  page,
}, info) => {
  await openScene(page, "s=live");
  const h = headerOf(page);
  await openFrom(page, h.people, peoplePanel(page));
  await observe(page, info, { people: h.people, panel: peoplePanel(page) }, async () => {
    await page.keyboard.press("Escape");
    await page.waitForTimeout(ROLL_WAIT);
  });
  await expect.soft(peoplePanel(page)).toHaveCount(0);
  expect.soft(await focusedName(page)).toBe("4 people here");
  await openFrom(page, h.me, myMenu(page));
  const stage = await middleOf(page.getByRole("region", { name: "Shared screen" }));
  await page.mouse.click(stage.x, stage.y);
  await page.waitForTimeout(ROLL_WAIT);
  await expect.soft(myMenu(page)).toHaveCount(0);
  await expect.soft(h.me).toHaveAttribute("aria-expanded", "false");
});

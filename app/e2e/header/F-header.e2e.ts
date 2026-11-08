import { expect, test } from "@playwright/test";
import { blinks, drift } from "../support/frames.ts";
import { openScene, wakeStage } from "../support/open.ts";
import { observe } from "../support/observe.ts";
import { boxOf, centreX, centreY, inside, windowBox } from "../support/geometry.ts";
import { computed, LOOK, pxOf, SIZE } from "../support/looks.ts";
import { focusedName, pointAt, pointAway } from "../support/pointer.ts";
import { onTop } from "../support/screen.ts";
import { stageOf } from "../support/stage.ts";
import {
  activityList,
  everyoneStops,
  headerOf,
  marinaGoesLive,
  myMenu,
  openFrom,
  peoplePanel,
  rolledUp,
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
    expect.soft(inside(await boxOf(el), windowBox(page))).toBe(true);
  }
  const [w, p, pe, me] = await Promise.all([h.wordmark, h.pill, h.people, h.me].map(boxOf));
  const { width } = windowBox(page);
  // Left, centre, right, in that order, all on one line.
  expect.soft(centreX(w!)).toBeLessThan(width / 3);
  expect.soft(Math.abs(centreX(p!) - width / 2)).toBeLessThan(width * 0.1);
  expect.soft(centreX(pe!)).toBeGreaterThan((width * 2) / 3);
  expect.soft(centreX(me!)).toBeGreaterThan(centreX(pe!));
  for (const m of [p!, pe!, me!]) expect.soft(Math.abs(centreY(m) - centreY(w!))).toBeLessThan(2);
  // At the top of the room, above the stage.
  const bar = await boxOf(h.bar);
  const stage = await boxOf(stageOf(page));
  expect.soft(bar.y).toBeLessThan(1);
  expect.soft(bar.y + bar.height).toBeLessThanOrEqual(stage.y + 1);
  for (const n of ["wordmark", "pill", "people", "me"]) expect.soft(blinks(seen.frames, n)).toEqual([]);
});

test("F-header.2 the bar is see-through and nothing covers its buttons", async ({ page }, info) => {
  await openScene(page, "s=live");
  const h = headerOf(page);
  await observe(page, info, { bar: h.bar, pill: h.pill, people: h.people, me: h.me }, () => pointAway(page));
  expect.soft(await styleOf(h.bar, "background-color")).toBe(await computed(page, "background-color", LOOK.clear));
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
  const red = await computed(page, "color", LOOK.accent);
  for (const r of rings) expect.soft(r).toBe(`solid ${red}`);
});

test("F-header.5 each panel opens 8 px under its button, inside the window, over the stage", async ({ page }, info) => {
  await openScene(page, "s=live");
  const h = headerOf(page);
  for (const [button, panel] of [
    [h.pill, activityList(page)],
    [h.people, peoplePanel(page)],
    [h.me, myMenu(page)],
  ] as const) {
    const seen = await observe(page, info, { button, panel }, () => openFrom(button, panel));
    const b = await boxOf(button);
    const p = await boxOf(panel);
    expect.soft(Math.abs(p.y - (b.y + b.height) - (await pxOf(page, SIZE.dropdownGap)))).toBeLessThan(1.5);
    expect.soft(inside(p, windowBox(page))).toBe(true);
    expect.soft(await onTop(panel)).toBe(true);
    await expect.soft(button).toHaveAttribute("aria-expanded", "true");
    expect.soft(drift(seen.frames, "button")).toBeLessThan(1);
    expect.soft(blinks(seen.frames, "button")).toEqual([]);
    await page.keyboard.press("Escape");
    await rolledUp(panel);
  }
});

test("F-header.6 one panel at a time: opening another closes the one open", async ({ page }, info) => {
  await openScene(page, "s=live");
  const h = headerOf(page);
  await openFrom(h.pill, activityList(page));
  const seen = await observe(page, info, { pill: h.pill, people: h.people }, async () => {
    await openFrom(h.people, peoplePanel(page));
  });
  await expect.soft(peoplePanel(page)).toBeVisible();
  await expect.soft(activityList(page)).toHaveCount(0);
  await expect.soft(h.pill).toHaveAttribute("aria-expanded", "false");
  await openFrom(h.me, myMenu(page));
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
  await openFrom(h.people, peoplePanel(page));
  await observe(page, info, { people: h.people, panel: peoplePanel(page) }, async () => {
    await page.keyboard.press("Escape");
    await rolledUp(peoplePanel(page));
  });
  await expect.soft(peoplePanel(page)).toHaveCount(0);
  await expect.soft(h.people).toBeFocused();
  await expect.soft(h.people).toHaveAccessibleName("4 people here");
  await openFrom(h.me, myMenu(page));
  const stage = await boxOf(stageOf(page));
  await page.mouse.click(centreX(stage), centreY(stage));
  await rolledUp(myMenu(page));
  await expect.soft(myMenu(page)).toHaveCount(0);
  await expect.soft(h.me).toHaveAttribute("aria-expanded", "false");
});

test("F-header.8 what the pointer is on stays put while the room's news changes the bar", async ({ page }, info) => {
  for (const name of ["pill", "people", "me"] as const) {
    await openScene(page, "s=live");
    const parts = headerOf(page);
    await pointAt(page, parts[name]);
    const seen = await observe(page, info, { pill: parts.pill, people: parts.people, me: parts.me }, async () => {
      await everyoneStops(page);
      await marinaGoesLive(page);
    });
    for (const part of ["pill", "people", "me"])
      expect.soft(drift(seen.frames, part), `${name}: ${part}`).toBeLessThan(1);
  }
});

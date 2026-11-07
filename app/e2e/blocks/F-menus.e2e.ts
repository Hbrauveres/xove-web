import { expect, test } from "@playwright/test";
import { blinks, drift } from "../support/frames.ts";
import { observe } from "../support/observe.ts";
import { boxOf, centreX, centreY } from "../support/geometry.ts";
import { APP_PX, computed, LOOK, pxOf, SIZE, WEIGHT } from "../support/looks.ts";
import { pointAt, pointAway, tabTo } from "../support/pointer.ts";
import { stageOf } from "../support/stage.ts";
import { LEAVE_GRACE_MS, spend, untilStill } from "../support/timing.ts";
import { openMyMenu, sharingMyScreen, watching } from "./where.ts";

test("F-menus.1 a menu row: its icon muted at rest, a faint white under it and its icon bright when pointed at", async ({
  page,
}, info) => {
  await watching(page);
  await page.getByRole("button", { name: "Go live" }).click();
  const row = page.getByRole("menuitem", { name: "Share your screen" });
  const icon = row.locator("svg");
  await expect.soft(row).toHaveCSS("background-color", await computed(page, "background-color", LOOK.clear));
  await expect.soft(icon).toHaveCSS("color", await computed(page, "color", LOOK.muted));
  const seen = await observe(page, info, { row, icon }, async () => {
    await pointAt(page, row);
  });
  await expect.soft(row).toHaveCSS("background-color", await computed(page, "background-color", LOOK.rowLit));
  await expect.soft(icon).toHaveCSS("color", await computed(page, "color", LOOK.text));
  await expect.soft(row).toHaveCSS("font-size", await computed(page, "font-size", SIZE.rowText));
  await expect.soft(row).toHaveCSS("font-weight", WEIGHT.medium);
  expect.soft(blinks(seen.frames, "icon")).toEqual([]);
  expect.soft(drift(seen.frames, "row")).toBeLessThan(1);
});

test("F-menus.2 focused by the keyboard, a menu row lights the same, with a red line inside its edge", async ({
  page,
}, info) => {
  const menu = await openMyMenu(page);
  const signOut = menu.getByRole("button", { name: "Sign out" });
  await observe(page, info, { signOut }, async () => {
    await tabTo(page, signOut);
  });
  await expect.soft(signOut).toBeFocused();
  await expect.soft(signOut).toHaveCSS("background-color", await computed(page, "background-color", LOOK.rowLit));
  await expect.soft(signOut).toHaveCSS("box-shadow", await computed(page, "box-shadow", LOOK.rowRing));
  await expect.soft(signOut.locator("svg")).toHaveCSS("color", await computed(page, "color", LOOK.text));
});

test("F-menus.3 a row that goes to a page is a link, one that acts is a button, both the same row", async ({
  page,
}, info) => {
  const menu = await openMyMenu(page, "&admin=1");
  const admin = menu.getByRole("link", { name: "Admin" });
  const signOut = menu.getByRole("button", { name: "Sign out" });
  const seen = await observe(page, info, { admin, signOut }, async () => {
    await pointAway(page);
  });
  await expect.soft(admin).toHaveAttribute("href", "/admin");
  await expect.soft(admin).toHaveCSS("text-decoration-line", "none");
  expect.soft(seen.before.admin?.box?.h).toBe(seen.before.signOut?.box?.h);
  expect.soft(seen.before.admin?.box?.w).toBe(seen.before.signOut?.box?.w);
  expect.soft(seen.before.admin?.look?.color).toBe(seen.before.signOut?.look?.color);
});

test("F-menus.4 a dropdown unrolls under its button by its height, never fading, and takes the focus", async ({
  page,
}, info) => {
  await watching(page);
  const button = page.getByRole("button", { name: /: account/ });
  const menu = page.getByRole("dialog", { name: "Account" });
  let frames: Awaited<ReturnType<typeof observe>>["frames"] = [];
  const seen = await observe(page, info, { button, menu }, async () => {
    await button.click();
  });
  frames = seen.frames.filter((f) => f.seen.menu?.present);
  await expect.soft(menu).toBeVisible();
  await expect.soft(menu).toBeFocused();
  await expect.soft(button).toHaveAttribute("aria-expanded", "true");
  const b = await boxOf(button);
  const m = await boxOf(menu);
  // 8 px under its button, its right edge at its button's.
  expect.soft(Math.abs(m.y - (b.y + b.height) - (await pxOf(page, SIZE.dropdownGap)))).toBeLessThan(1.5);
  expect.soft(Math.abs(m.x + m.width - (b.x + b.width))).toBeLessThan(2);
  expect.soft(m.width).toBe(APP_PX.myMenu);
  // Unrolled by its height: never faded, its top still.
  expect.soft(frames.every((f) => (f.seen.menu?.opacity ?? 1) === 1)).toBe(true);
  expect.soft(drift(frames, "menu")).toBeLessThan(1);
});

test("F-menus.5 Escape rolls a dropdown back up and gives the focus back to its button", async ({ page }, info) => {
  const menu = await openMyMenu(page);
  const button = page.getByRole("button", { name: /: account/ });
  const seen = await observe(page, info, { menu, button }, async () => {
    await page.keyboard.press("Escape");
  });
  await expect.soft(menu).toHaveCount(0);
  await expect.soft(button).toBeFocused();
  await expect.soft(button).toHaveAttribute("aria-expanded", "false");
  expect.soft(drift(seen.frames, "button")).toBeLessThan(1);
});

test("F-menus.6 a press outside closes a dropdown", async ({ page }, info) => {
  const menu = await openMyMenu(page);
  await observe(page, info, { menu }, async () => {
    const s = await boxOf(stageOf(page));
    await page.mouse.click(s.x + s.width / 3, centreY(s));
  });
  await expect.soft(menu).toHaveCount(0);
});

test("F-menus.7 a panel's sections: frosted glass each, 16 px outer corners, 2 px clear cuts between", async ({
  page,
}, info) => {
  const menu = await openMyMenu(page);
  const sections = menu.locator(":scope > div > div");
  await observe(page, info, { menu }, async () => {
    await pointAway(page);
  });
  await expect.soft(sections).toHaveCount(3);
  const looks = await sections.evaluateAll((all) =>
    all.map((e) => {
      const r = e.getBoundingClientRect();
      const s = getComputedStyle(e);
      return { top: r.top, bottom: r.bottom, filter: s.backdropFilter, bg: s.backgroundColor, radius: s.borderRadius };
    }),
  );
  const filter = await computed(page, "backdrop-filter", LOOK.panelFilter);
  const bg = await computed(page, "background-color", LOOK.panel);
  for (const l of looks) {
    expect.soft(l.filter).toBe(filter);
    expect.soft(l.bg).toBe(bg);
  }
  const cut = await pxOf(page, SIZE.sectionCut);
  looks.slice(1).forEach((l, i) => expect.soft(l.top - (looks[i]?.bottom ?? l.top)).toBe(cut));
  const corner = SIZE.panelCorner;
  expect.soft(looks[0]?.radius).toBe(await computed(page, "border-radius", `${corner} ${corner} 0 0`));
  expect.soft(looks.at(-1)?.radius).toBe(await computed(page, "border-radius", `0 0 ${corner} ${corner}`));
});

test("F-menus.8 resting on a live round button unrolls its drop-up above it, centred, a frosted 36 px pill", async ({
  page,
}, info) => {
  await sharingMyScreen(page);
  const button = page.getByRole("button", { name: "Stop sharing your screen" });
  const dropUp = page.getByRole("group", { name: "What you share" });
  let open = { visible: false, row: { h: 0, filter: "", radius: "" } };
  const seen = await observe(page, info, { button, dropUp }, async () => {
    await pointAt(page, button);
    await dropUp.waitFor();
    await untilStill(dropUp);
    open = await dropUp.evaluate((e) => {
      const row = e.firstElementChild as HTMLElement;
      const s = getComputedStyle(row);
      return {
        visible: getComputedStyle(e).visibility === "visible" && getComputedStyle(e).opacity === "1",
        row: { h: row.getBoundingClientRect().height, filter: s.backdropFilter, radius: s.borderRadius },
      };
    });
  });
  expect.soft(open.visible).toBe(true);
  expect.soft(open.row.h).toBe(await pxOf(page, SIZE.dropUpRow));
  expect.soft(open.row.filter).toBe(await computed(page, "backdrop-filter", LOOK.glassBlur));
  expect.soft(open.row.radius).toBe(await computed(page, "border-radius", LOOK.pillEnds));
  await expect.soft(dropUp.getByRole("button", { name: "Change" })).toHaveCount(1);
  await expect.soft(dropUp).toContainText("Your screen");
  const b = await boxOf(button);
  const d = await boxOf(dropUp);
  expect.soft(d.y + d.height).toBeLessThan(b.y);
  expect.soft(Math.abs(centreX(d) - centreX(b))).toBeLessThan(1);
  expect.soft(drift(seen.frames, "button")).toBeLessThan(1);
});

test("F-menus.9 moving up into the drop-up keeps it open; leaving closes it", async ({ page }, info) => {
  await sharingMyScreen(page);
  const button = page.getByRole("button", { name: "Stop sharing your screen" });
  const dropUp = page.getByRole("group", { name: "What you share" });
  const change = dropUp.getByRole("button", { name: "Change" });
  let inside = "";
  await observe(page, info, { button, dropUp }, async () => {
    await pointAt(page, button);
    await dropUp.waitFor();
    await untilStill(dropUp);
    await pointAt(page, change);
    // Past the grace a slip outside gets: had the move up counted as leaving, it would be closed.
    await spend(page, LEAVE_GRACE_MS);
    await untilStill(page);
    inside = await dropUp.evaluate((e) => getComputedStyle(e).visibility);
    await pointAway(page);
    await dropUp.waitFor({ state: "hidden" });
  });
  expect.soft(inside).toBe("visible");
  // Closed: out of reach (inert) and unseen.
  await expect.soft(dropUp).toHaveCount(0);
  await expect.soft(page.locator('fieldset[aria-label="What you share"]')).toHaveCSS("visibility", "hidden");
});

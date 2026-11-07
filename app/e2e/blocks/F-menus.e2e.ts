import { expect, test } from "@playwright/test";
import { blinks, drift } from "../support/frames.ts";
import { observe } from "../support/observe.ts";
import { COLOR, myMenu, pointAt, pointAway, sharingMyScreen, tabTo, watching } from "./where.ts";

test("F-menus.1 a menu row: its icon muted at rest, a faint white under it and its icon bright when pointed at", async ({
  page,
}, info) => {
  await watching(page);
  await page.getByRole("button", { name: "Go live" }).click();
  const row = page.getByRole("menuitem", { name: "Share your screen" });
  const icon = row.locator("svg");
  await expect.soft(row).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect.soft(icon).toHaveCSS("color", COLOR.muted);
  const seen = await observe(page, info, { row, icon }, async () => {
    await pointAt(page, row);
  });
  await expect.soft(row).toHaveCSS("background-color", "rgba(255, 255, 255, 0.06)");
  await expect.soft(icon).toHaveCSS("color", COLOR.text);
  await expect.soft(row).toHaveCSS("font-size", "13.5px");
  await expect.soft(row).toHaveCSS("font-weight", "500");
  expect.soft(blinks(seen.frames, "icon")).toEqual([]);
  expect.soft(drift(seen.frames, "row")).toBeLessThan(1);
});

test("F-menus.2 focused by the keyboard, a menu row lights the same, with a red line inside its edge", async ({
  page,
}, info) => {
  const menu = await myMenu(page);
  const signOut = menu.getByRole("button", { name: "Sign out" });
  await observe(page, info, { signOut }, async () => {
    await tabTo(page, signOut);
  });
  await expect.soft(signOut).toBeFocused();
  await expect.soft(signOut).toHaveCSS("background-color", "rgba(255, 255, 255, 0.06)");
  await expect.soft(signOut).toHaveCSS("box-shadow", `${COLOR.accent} 0px 0px 0px 2px inset`);
  await expect.soft(signOut.locator("svg")).toHaveCSS("color", COLOR.text);
});

test("F-menus.3 a row that goes to a page is a link, one that acts is a button, both the same row", async ({
  page,
}, info) => {
  const menu = await myMenu(page, "&admin=1");
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
  const b = await button.boundingBox();
  const m = await menu.boundingBox();
  // 8 px under its button's wrapper, its right edge at its button's.
  expect.soft((m?.y ?? 0) - ((b?.y ?? 0) + (b?.height ?? 0))).toBeGreaterThanOrEqual(0);
  expect.soft(Math.abs((m?.x ?? 0) + (m?.width ?? 0) - ((b?.x ?? 0) + (b?.width ?? 0)))).toBeLessThan(2);
  expect.soft(m?.width).toBe(260);
  // Unrolled by its height: never faded, its top still.
  expect.soft(frames.every((f) => (f.seen.menu?.opacity ?? 1) === 1)).toBe(true);
  expect.soft(drift(frames, "menu")).toBeLessThan(1);
});

test("F-menus.5 Escape rolls a dropdown back up and gives the focus back to its button", async ({ page }, info) => {
  const menu = await myMenu(page);
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
  const menu = await myMenu(page);
  const stage = page.getByRole("region", { name: "Shared screen" });
  await observe(page, info, { menu }, async () => {
    const s = await stage.boundingBox();
    if (s) await page.mouse.click(s.x + s.width / 3, s.y + s.height / 2);
  });
  await expect.soft(menu).toHaveCount(0);
});

test("F-menus.7 a panel's sections: frosted glass each, 16 px outer corners, 2 px clear cuts between", async ({
  page,
}, info) => {
  const menu = await myMenu(page);
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
  for (const l of looks) {
    expect.soft(l.filter).toBe("blur(22px) brightness(0.55) saturate(1.2)");
    expect.soft(l.bg).toBe("rgba(18, 18, 20, 0.74)");
  }
  for (let i = 1; i < looks.length; i++) expect.soft(looks[i]!.top - looks[i - 1]!.bottom).toBe(2);
  expect.soft(looks[0]?.radius).toBe("16px 16px 0px 0px");
  expect.soft(looks.at(-1)?.radius).toBe("0px 0px 16px 16px");
});

test("F-menus.8 resting on a live round button unrolls its drop-up above it, centred, a frosted 36 px pill", async ({
  page,
}, info) => {
  await sharingMyScreen(page);
  const button = page.getByRole("button", { name: "Stop sharing your screen" });
  const dropUp = page.getByRole("group", { name: "What you share" });
  let open = { visible: false, row: { h: 0, filter: "", radius: "" } };
  const seen = await observe(
    page,
    info,
    { button, dropUp },
    async () => {
      await pointAt(page, button);
      await page.waitForTimeout(400);
      open = await dropUp.evaluate((e) => {
        const row = e.firstElementChild as HTMLElement;
        const s = getComputedStyle(row);
        return {
          visible: getComputedStyle(e).visibility === "visible" && getComputedStyle(e).opacity === "1",
          row: { h: row.getBoundingClientRect().height, filter: s.backdropFilter, radius: s.borderRadius },
        };
      });
    },
    { settle: 100 },
  );
  expect.soft(open.visible).toBe(true);
  expect.soft(open.row.h).toBe(36);
  expect.soft(open.row.filter).toBe("blur(8px)");
  expect.soft(open.row.radius).toBe("999px");
  await expect.soft(dropUp.getByRole("button", { name: "Change" })).toHaveCount(1);
  await expect.soft(dropUp).toContainText("Your screen");
  const b = seen.after.button?.box;
  const d = seen.after.dropUp?.box;
  if (b && d) {
    expect.soft(d.y + d.h).toBeLessThan(b.y);
    expect.soft(Math.abs(d.x + d.w / 2 - (b.x + b.w / 2))).toBeLessThan(1);
  }
  expect.soft(drift(seen.frames, "button")).toBeLessThan(1);
});

test("F-menus.9 moving up into the drop-up keeps it open; leaving closes it", async ({ page }, info) => {
  await sharingMyScreen(page);
  const button = page.getByRole("button", { name: "Stop sharing your screen" });
  const dropUp = page.getByRole("group", { name: "What you share" });
  const change = dropUp.getByRole("button", { name: "Change" });
  let inside = "";
  await observe(
    page,
    info,
    { button, dropUp },
    async () => {
      await pointAt(page, button);
      await page.waitForTimeout(400);
      await pointAt(page, change);
      await page.waitForTimeout(500);
      inside = await dropUp.evaluate((e) => getComputedStyle(e).visibility);
      await page.mouse.move(400, 300, { steps: 3 });
      await page.waitForTimeout(600);
    },
    { settle: 100 },
  );
  expect.soft(inside).toBe("visible");
  // Closed: out of reach (inert) and unseen.
  await expect.soft(dropUp).toHaveCount(0);
  await expect.soft(page.locator('fieldset[aria-label="What you share"]')).toHaveCSS("visibility", "hidden");
});

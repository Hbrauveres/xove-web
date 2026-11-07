import { expect, test } from "@playwright/test";
import { blinks } from "../support/frames.ts";
import { openScene } from "../support/open.ts";
import { observe } from "../support/observe.ts";

test("F-app-shell.1 a member lands in the room, with its header", async ({ page }, info) => {
  await openScene(page, "s=live");
  const stage = page.getByRole("region", { name: "Shared screen" });
  const banner = page.getByRole("banner");
  await observe(page, info, { stage, banner }, async () => {
    await page.mouse.move(1, 1);
  });
  await expect.soft(stage).toBeVisible();
  await expect.soft(banner.getByRole("img", { name: "Xovê" })).toBeVisible();
  await expect.soft(page.getByRole("link", { name: "Continue with Google" })).toHaveCount(0);
  await expect.soft(page.getByText("Loading…", { exact: true })).toHaveCount(0);
});

test("F-app-shell.2 signing out in the room lands on the sign-in page", async ({ page }, info) => {
  await openScene(page, "s=live");
  await page.getByRole("button", { name: /: account/ }).click();
  const signOut = page.getByRole("button", { name: "Sign out" });
  await observe(page, info, { signOut }, async () => {
    await signOut.click();
  });
  await expect.soft(page.getByRole("link", { name: "Continue with Google" })).toBeVisible();
  await expect.soft(page.getByRole("region", { name: "Shared screen" })).toHaveCount(0);
});

test("F-app-shell.3 an admin's Admin row in my menu opens the admin page", async ({ page }, info) => {
  await openScene(page, "s=live&admin=1");
  await page.getByRole("button", { name: /: account/ }).click();
  const admin = page.getByRole("link", { name: "Admin" });
  await observe(page, info, { admin }, async () => {
    await admin.click();
  });
  await expect.soft(page.getByRole("heading", { level: 2, name: /^Waiting for access/ })).toBeVisible();
  await expect.soft(page.getByRole("link", { name: "Back to the room" })).toBeVisible();
});

test("F-app-shell.4 the fonts load: Bricolage Grotesque for headings, IBM Plex Sans for text, IBM Plex Mono for counters", async ({
  page,
}, info) => {
  await openScene(page, "s=live");
  const heading = page.getByRole("heading", { level: 2, name: "Marina" });
  await observe(page, info, { heading }, async () => {
    await page.mouse.move(1, 1);
  });
  const loaded = await page.evaluate(() =>
    [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family.replace(/"/g, "")),
  );
  for (const family of ["Bricolage Grotesque", "IBM Plex Sans", "IBM Plex Mono"]) expect.soft(loaded).toContain(family);
  await expect.soft(heading).toHaveCSS("font-family", /^"Bricolage Grotesque"/);
  await expect.soft(page.locator("body")).toHaveCSS("font-family", /^"IBM Plex Sans"/);
  await expect.soft(page.getByText("LIVE", { exact: true }).first()).toHaveCSS("font-family", /^"IBM Plex Mono"/);
});

test("F-app-shell.5 the global styles: the dark ground, the text colour, no page margin, dark controls", async ({
  page,
}, info) => {
  await openScene(page, "page=request");
  const body = page.locator("body");
  await observe(page, info, { body }, async () => {
    await page.mouse.move(1, 1);
  });
  await expect.soft(body).toHaveCSS("background-color", "rgb(12, 12, 13)");
  await expect.soft(body).toHaveCSS("color", "rgb(235, 235, 236)");
  await expect.soft(body).toHaveCSS("margin", "0px");
  await expect.soft(body).toHaveCSS("line-height", "22.5px");
  await expect.soft(page.locator("html")).toHaveCSS("color-scheme", "dark");
  const wide = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect.soft(wide).toBeLessThanOrEqual(0);
});

test("F-app-shell.6 the page shell centres a page's column, the sign-in page with a soft red glow at the top", async ({
  page,
}, info) => {
  await openScene(page, "page=home");
  const shell = page.getByRole("main");
  const column = page.getByRole("region", { name: "Go live with your friends." });
  await observe(page, info, { shell, column }, async () => {
    await page.mouse.move(1, 1);
  });
  await expect.soft(shell).toHaveCSS("background-image", /radial-gradient\(.*rgba\(239, 75, 75, 0\.14\)/);
  const box = await column.boundingBox();
  const size = page.viewportSize() ?? { width: 0, height: 0 };
  expect.soft(Math.abs((box?.x ?? 0) + (box?.width ?? 0) / 2 - size.width / 2)).toBeLessThan(1);
  expect.soft(box?.width ?? 0).toBeLessThanOrEqual(420);
  // The form page: the same frame, its column no wider than a card, no glow.
  await openScene(page, "page=request");
  await expect.soft(page.getByRole("main")).toHaveCSS("background-image", "none");
  await expect.soft(page.getByRole("main")).toHaveCSS("background-color", "rgb(12, 12, 13)");
});

test("F-app-shell.7 the wordmark plays once when pointed at and comes back to rest", async ({ page }, info) => {
  await openScene(page, "page=home");
  const mark = page.getByRole("img", { name: "Xovê" });
  const letters = mark.locator("[data-letters]");
  const seen = await observe(
    page,
    info,
    { mark, letters },
    async () => {
      await mark.hover();
      await page.waitForTimeout(600);
    },
    { settle: 3200 },
  );
  // It moved while it played: the letters slid left.
  const xs = seen.frames.map((f) => f.seen.letters?.box?.x ?? 0);
  expect.soft(Math.min(...xs)).toBeLessThan(xs[0]! - 5);
  // And it's back where it started.
  expect.soft(seen.after.letters?.box).toEqual(seen.before.letters?.box);
  expect.soft(blinks(seen.frames, "mark")).toEqual([]);
  await expect.soft(mark).not.toHaveAttribute("tabindex", /.*/);
});

test("F-app-shell.8 the keyboard's focus is a red ring, 2 px out, on any control without its own", async ({
  page,
}, info) => {
  await openScene(page, "page=request");
  const other = page.getByRole("button", { name: "Use another account" });
  await observe(page, info, { other }, async () => {
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
  });
  await expect.soft(other).toBeFocused();
  await expect.soft(other).toHaveCSS("outline", "rgb(239, 75, 75) solid 2px");
  await expect.soft(other).toHaveCSS("outline-offset", "2px");
});

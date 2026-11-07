import { expect, test } from "@playwright/test";
import { blinks, drift } from "../support/frames.ts";
import { openScene } from "../support/open.ts";
import { observe } from "../support/observe.ts";
import { boxOf, inside, windowBox } from "../support/geometry.ts";
import { APP_PX } from "../support/looks.ts";
import { pointAt } from "../support/pointer.ts";
import { headerOf, myMenu, openFrom, rolledUp } from "./header.ts";

test("F-my-menu.1 my picture says who I am and that I'm connected, with a green dot", async ({ page }, info) => {
  await openScene(page, "s=live");
  const { me } = headerOf(page);
  const dot = me.locator("i[data-state]");
  const seen = await observe(page, info, { me, dot }, () => pointAt(page, me));
  await expect.soft(me).toHaveAccessibleName("Henrique: account, connected");
  await expect.soft(dot).toHaveAttribute("data-state", "connected");
  await expect.soft(dot).toBeVisible();
  await expect.soft(me).toHaveAttribute("aria-expanded", "false");
  // A hover opens nothing.
  await expect.soft(myMenu(page)).toHaveCount(0);
  expect.soft(drift(seen.frames, "me")).toBeLessThan(1);
  expect.soft(blinks(seen.frames, "me")).toEqual([]);
});

test("F-my-menu.2 a click opens my menu: my name, Member, Connected, the ambilight, Sign out", async ({
  page,
}, info) => {
  await openScene(page, "s=live");
  const { me } = headerOf(page);
  const menu = myMenu(page);
  const seen = await observe(page, info, { me, menu }, async () => {
    await openFrom(me, menu);
  });
  await expect.soft(menu).toBeVisible();
  for (const words of ["Henrique", "Member", "Connected"])
    await expect.soft(menu.getByText(words, { exact: true })).toBeVisible();
  await expect.soft(menu.getByRole("switch", { name: "Ambilight" })).toBeChecked();
  await expect.soft(menu.getByRole("slider", { name: "Ambilight brightness" })).toBeEnabled();
  await expect.soft(menu.getByRole("button", { name: "Sign out" })).toBeVisible();
  // A member has no Admin.
  await expect.soft(menu.getByRole("link", { name: "Admin" })).toHaveCount(0);
  // 260 px wide, its right edge on my picture's, whole in the window.
  const m = await boxOf(menu);
  const b = await boxOf(me);
  expect.soft(Math.round(m.width)).toBe(APP_PX.myMenu);
  expect.soft(Math.abs(m.x + m.width - (b.x + b.width))).toBeLessThan(1.5);
  expect.soft(inside(m, windowBox(page))).toBe(true);
  expect.soft(drift(seen.frames, "me")).toBeLessThan(1);
});

test("F-my-menu.3 an admin's menu says Admin and leads to the admin page", async ({ page }, info) => {
  await openScene(page, "s=live&admin=1");
  const { me } = headerOf(page);
  const menu = myMenu(page);
  await openFrom(me, menu);
  const admin = menu.getByRole("link", { name: "Admin" });
  await expect.soft(menu.getByText("Admin", { exact: true }).first()).toBeVisible();
  await expect.soft(menu.getByText("Member", { exact: true })).toHaveCount(0);
  await expect.soft(admin).toHaveAttribute("href", "/admin");
  await observe(page, info, { admin }, async () => {
    await admin.click();
    await page.getByRole("heading", { name: /^Waiting for access/ }).waitFor();
  });
  await expect.soft(page.getByRole("heading", { name: /^Waiting for access/ })).toBeVisible();
  await expect.soft(page.getByRole("link", { name: "Back to the room" })).toBeVisible();
});

test("F-my-menu.4 the ambilight's switch turns it off and greys its brightness", async ({ page }, info) => {
  await openScene(page, "s=live");
  const { me } = headerOf(page);
  const menu = myMenu(page);
  await openFrom(me, menu);
  const sw = menu.getByRole("switch", { name: "Ambilight" });
  const slider = menu.getByRole("slider", { name: "Ambilight brightness" });
  const seen = await observe(page, info, { sw, slider, menu }, async () => {
    await sw.click();
    await expect(sw).not.toBeChecked();
  });
  await expect.soft(sw).not.toBeChecked();
  await expect.soft(slider).toBeDisabled();
  // The menu stays open, still.
  await expect.soft(menu).toBeVisible();
  expect.soft(drift(seen.frames, "sw")).toBeLessThan(1);
  expect.soft(drift(seen.frames, "menu")).toBeLessThan(1);
  await sw.click();
  await expect.soft(sw).toBeChecked();
  await expect.soft(slider).toBeEnabled();
});

test("F-my-menu.5 Sign out leaves the room for the sign-in page", async ({ page }, info) => {
  await openScene(page, "s=live");
  const { me } = headerOf(page);
  const menu = myMenu(page);
  await openFrom(me, menu);
  const out = menu.getByRole("button", { name: "Sign out" });
  await observe(page, info, { out }, async () => {
    await out.click();
    await page.getByRole("link", { name: "Continue with Google" }).waitFor();
  });
  await expect.soft(page.getByRole("link", { name: "Continue with Google" })).toBeVisible();
  await expect.soft(page.getByRole("banner")).toHaveCount(0);
});

test("F-my-menu.6 Escape closes it and the focus goes back to my picture", async ({ page }, info) => {
  await openScene(page, "s=live");
  const { me } = headerOf(page);
  await openFrom(me, myMenu(page));
  const seen = await observe(page, info, { me }, async () => {
    await page.keyboard.press("Escape");
    await rolledUp(myMenu(page));
  });
  await expect.soft(myMenu(page)).toHaveCount(0);
  await expect.soft(me).toHaveAttribute("aria-expanded", "false");
  await expect.soft(me).toBeFocused();
  await expect.soft(me).toHaveAccessibleName("Henrique: account, connected");
  expect.soft(drift(seen.frames, "me")).toBeLessThan(1);
  expect.soft(blinks(seen.frames, "me")).toEqual([]);
});

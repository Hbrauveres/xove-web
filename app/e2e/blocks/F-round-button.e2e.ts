import { expect, test } from "@playwright/test";
import { blinks, drift } from "../support/frames.ts";
import { observe } from "../support/observe.ts";
import { COLOR, overPicture, pointAt, sharingMyScreen, tabTo, watching } from "./where.ts";

test("F-round-button.1 at rest: a round of dark frosted glass with a soft shadow, its icon in white", async ({
  page,
}, info) => {
  await watching(page);
  const full = page.getByRole("button", { name: "Fullscreen" });
  await observe(page, info, { full }, async () => {
    await overPicture(page);
  });
  await expect.soft(full).toHaveCSS("background-color", COLOR.glass);
  await expect.soft(full).toHaveCSS("backdrop-filter", "blur(8px)");
  await expect.soft(full).toHaveCSS("box-shadow", /rgba\(0, 0, 0, 0\.35\) 0px 4px 16px/);
  await expect.soft(full).toHaveCSS("border-radius", "50%");
  await expect.soft(full).toHaveCSS("color", COLOR.text);
  const icon = full.locator("svg[data-icon]");
  await expect.soft(icon).toHaveAttribute("aria-hidden", "true");
  await expect.soft(icon).toBeVisible();
});

test("F-round-button.2 M is 34 px with a 16 px icon, for every round button that isn't my own", async ({
  page,
}, info) => {
  await watching(page);
  const full = page.getByRole("button", { name: "Fullscreen" });
  const sound = page.getByRole("button", { name: "No sound in this stream" });
  await observe(page, info, { full, sound }, async () => {
    await overPicture(page);
  });
  for (const b of [full, sound]) {
    const box = await b.boundingBox();
    expect.soft(box?.width).toBe(34);
    expect.soft(box?.height).toBe(34);
    const icon = await b.locator("svg").boundingBox();
    expect.soft(icon?.width).toBe(16);
  }
});

test("F-round-button.3 pointed at, the glass lightens and the icon stays, still, in place", async ({ page }, info) => {
  await watching(page);
  const full = page.getByRole("button", { name: "Fullscreen" });
  const icon = full.locator("svg");
  // Read while the pointer rests on it: the stage's controls fade on their own a while after.
  let lit = "";
  const seen = await observe(
    page,
    info,
    { full, icon },
    async () => {
      await pointAt(page, full);
      await page.waitForTimeout(200);
      lit = await full.evaluate((e) => getComputedStyle(e).backgroundColor);
    },
    { settle: 100 },
  );
  expect.soft(lit).toBe(COLOR.glassLit);
  expect.soft(blinks(seen.frames, "icon")).toEqual([]);
  expect.soft(blinks(seen.frames, "full")).toEqual([]);
  expect.soft(drift(seen.frames, "full")).toBeLessThan(1);
  expect.soft(drift(seen.frames, "icon")).toBeLessThan(1);
});

test("F-round-button.4 the keyboard's focus draws one red ring around it", async ({ page }, info) => {
  await watching(page);
  const full = page.getByRole("button", { name: "Fullscreen" });
  await observe(page, info, { full }, async () => {
    await tabTo(page, full, 30);
  });
  await expect.soft(full).toBeFocused();
  await expect.soft(full).toHaveCSS("outline", `${COLOR.accent} solid 2px`);
  await expect.soft(full).toHaveCSS("outline-offset", "2px");
});

test("F-round-button.5 unavailable, it stays in place at 45% and doesn't light when pointed at", async ({
  page,
}, info) => {
  await watching(page);
  const sound = page.getByRole("button", { name: "No sound in this stream" });
  const seen = await observe(page, info, { sound }, async () => {
    await pointAt(page, sound);
  });
  await expect.soft(sound).toHaveAttribute("aria-disabled", "true");
  await expect.soft(sound).toHaveCSS("opacity", "0.45");
  await expect.soft(sound).toHaveCSS("background-color", COLOR.glass);
  await expect.soft(sound).toHaveCSS("cursor", "not-allowed");
  expect.soft(drift(seen.frames, "sound")).toBeLessThan(1);
});

test("F-round-button.6 my own are L, 48 px with a 20 px icon, and red with a deep-red icon while on", async ({
  page,
}, info) => {
  await sharingMyScreen(page);
  const screen = page.getByRole("button", { name: "Stop sharing your screen" });
  const camera = page.getByRole("button", { name: "Turn on your camera" });
  await observe(page, info, { screen, camera }, async () => {
    await overPicture(page);
  });
  for (const b of [screen, camera]) {
    const box = await b.boundingBox();
    expect.soft(box?.width).toBe(48);
    expect.soft(box?.height).toBe(48);
    expect.soft((await b.locator("svg").boundingBox())?.width).toBe(20);
  }
  await expect.soft(screen).toHaveAttribute("aria-pressed", "true");
  await expect.soft(screen).toHaveCSS("background-color", COLOR.accent);
  await expect.soft(screen).toHaveCSS("color", COLOR.accentInk);
  await expect.soft(camera).toHaveCSS("background-color", COLOR.glass);
});

test("F-round-button.7 on and pointed at, it stays red and its icon stays shown", async ({ page }, info) => {
  await sharingMyScreen(page);
  const screen = page.getByRole("button", { name: "Stop sharing your screen" });
  const icon = screen.locator("svg");
  // Read while the pointer rests on it: the stage's controls fade on their own a while after.
  let look = { fill: "", icon: 0, size: 0 };
  const seen = await observe(
    page,
    info,
    { screen, icon },
    async () => {
      await pointAt(page, screen);
      await page.waitForTimeout(300);
      look = await screen.evaluate((e) => {
        let opacity = 1;
        for (let el: Element | null = e.querySelector("svg"); el; el = el.parentElement)
          opacity *= Number(getComputedStyle(el).opacity);
        const svg = e.querySelector("svg");
        return {
          fill: getComputedStyle(e).backgroundColor,
          icon: opacity,
          size: svg ? svg.getBoundingClientRect().width : 0,
        };
      });
    },
    { settle: 100 },
  );
  expect.soft(look.fill).toBe(COLOR.accent);
  expect.soft(look.icon).toBe(1);
  // Its icon keeps its 20 px.
  expect.soft(look.size).toBe(20);
  await expect.soft(icon).toHaveCount(1);
  expect.soft(blinks(seen.frames, "icon")).toEqual([]);
  expect.soft(drift(seen.frames, "screen")).toBeLessThan(1);
});

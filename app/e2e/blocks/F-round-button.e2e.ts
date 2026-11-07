import { expect, test } from "@playwright/test";
import { blinks, drift } from "../support/frames.ts";
import { observe } from "../support/observe.ts";
import { boxOf } from "../support/geometry.ts";
import { computed, FADED, LOOK, pxOf, SIZE, within } from "../support/looks.ts";
import { overPicture, pointAt, restOn, tabTo } from "../support/pointer.ts";
import { OPEN_DELAY_MS, untilStill } from "../support/timing.ts";
import { sharingMyScreen, watching } from "./where.ts";

test("F-round-button.1 at rest: a round of dark frosted glass with a soft shadow, its icon in white", async ({
  page,
}, info) => {
  await watching(page);
  const full = page.getByRole("button", { name: "Fullscreen" });
  await observe(page, info, { full }, async () => {
    await overPicture(page);
  });
  await expect.soft(full).toHaveCSS("background-color", await computed(page, "background-color", LOOK.glass));
  await expect.soft(full).toHaveCSS("backdrop-filter", await computed(page, "backdrop-filter", LOOK.glassBlur));
  await expect.soft(full).toHaveCSS("box-shadow", within(await computed(page, "box-shadow", LOOK.glassShadow)));
  await expect.soft(full).toHaveCSS("border-radius", LOOK.round);
  await expect.soft(full).toHaveCSS("color", await computed(page, "color", LOOK.text));
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
  const size = await pxOf(page, SIZE.buttonM);
  const iconSize = await pxOf(page, SIZE.iconM);
  for (const b of [full, sound]) {
    const box = await boxOf(b);
    expect.soft(box.width).toBe(size);
    expect.soft(box.height).toBe(size);
    expect.soft((await boxOf(b.locator("svg"))).width).toBe(iconSize);
  }
});

test("F-round-button.3 pointed at, the glass lightens and the icon stays, still, in place", async ({ page }, info) => {
  await watching(page);
  const full = page.getByRole("button", { name: "Fullscreen" });
  const icon = full.locator("svg");
  // Read while the pointer rests on it: the stage's controls fade on their own a while after.
  let lit = "";
  const seen = await observe(page, info, { full, icon }, async () => {
    await pointAt(page, full);
    await untilStill(full);
    lit = await full.evaluate((e) => getComputedStyle(e).backgroundColor);
  });
  expect.soft(lit).toBe(await computed(page, "background-color", LOOK.glassLit));
  expect.soft(blinks(seen.frames, "icon")).toEqual([]);
  expect.soft(blinks(seen.frames, "full")).toEqual([]);
  expect.soft(drift(seen.frames, "full")).toBeLessThan(1);
  expect.soft(drift(seen.frames, "icon")).toBeLessThan(1);
});

test("F-round-button.4 the keyboard's focus draws one red ring around it", async ({ page }, info) => {
  await watching(page);
  const full = page.getByRole("button", { name: "Fullscreen" });
  await observe(page, info, { full }, async () => {
    await tabTo(page, full);
  });
  await expect.soft(full).toBeFocused();
  await expect.soft(full).toHaveCSS("outline", await computed(page, "outline", LOOK.focusRing));
  await expect.soft(full).toHaveCSS("outline-offset", await computed(page, "outline-offset", LOOK.focusOffset));
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
  await expect.soft(sound).toHaveCSS("opacity", FADED.unavailable);
  await expect.soft(sound).toHaveCSS("background-color", await computed(page, "background-color", LOOK.glass));
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
  const size = await pxOf(page, SIZE.buttonL);
  const iconSize = await pxOf(page, SIZE.iconL);
  for (const b of [screen, camera]) {
    const box = await boxOf(b);
    expect.soft(box.width).toBe(size);
    expect.soft(box.height).toBe(size);
    expect.soft((await boxOf(b.locator("svg"))).width).toBe(iconSize);
  }
  await expect.soft(screen).toHaveAttribute("aria-pressed", "true");
  await expect.soft(screen).toHaveCSS("background-color", await computed(page, "background-color", LOOK.accent));
  await expect.soft(screen).toHaveCSS("color", await computed(page, "color", LOOK.accentInk));
  await expect.soft(camera).toHaveCSS("background-color", await computed(page, "background-color", LOOK.glass));
});

test("F-round-button.7 on and pointed at, it stays red and its icon stays shown", async ({ page }, info) => {
  await sharingMyScreen(page);
  const screen = page.getByRole("button", { name: "Stop sharing your screen" });
  const icon = screen.locator("svg");
  // Read while the pointer rests on it: the stage's controls fade on their own a while after.
  let look = { fill: "", icon: 0, size: 0 };
  const seen = await observe(page, info, { screen, icon }, async () => {
    // At rest on it: what pointing at a live button brings (its drop-up) has come.
    await restOn(page, screen, OPEN_DELAY_MS);
    await untilStill(page);
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
  });
  expect.soft(look.fill).toBe(await computed(page, "background-color", LOOK.accent));
  expect.soft(look.icon).toBe(1);
  // Its icon keeps its 20 px.
  expect.soft(look.size).toBe(await pxOf(page, SIZE.iconL));
  await expect.soft(icon).toHaveCount(1);
  expect.soft(blinks(seen.frames, "icon")).toEqual([]);
  expect.soft(drift(seen.frames, "screen")).toBeLessThan(1);
});

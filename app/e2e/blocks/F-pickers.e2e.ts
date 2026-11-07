import { expect, test } from "@playwright/test";
import { blinks, drift } from "../support/frames.ts";
import { observe } from "../support/observe.ts";
import { COLOR, myCameraOn, pointAt, pseudo, settingsOn } from "./where.ts";

const OTHERS = ["MacBook Pro camera", "OBS Virtual Camera", "Elgato Facecam", "Iriun Webcam", "Continuity Camera"];

test("F-pickers.1 closed, a picker is a pill with the chosen option and a chevron", async ({ page }, info) => {
  const panel = await settingsOn(page, "Camera");
  const pill = panel.getByRole("button", { name: "Camera: Webcam C920" });
  await observe(page, info, { pill }, async () => {
    await page.mouse.move(2, 2);
  });
  await expect.soft(pill).toHaveText("Webcam C920");
  await expect.soft(pill).toHaveAttribute("aria-expanded", "false");
  await expect.soft(pill.locator('svg[data-icon="chevron"]')).toBeVisible();
  expect.soft((await pill.boundingBox())?.height).toBe(30);
  await expect.soft(panel.getByRole("menu", { name: "Camera" })).toHaveCount(0);
});

test("F-pickers.2 open, the pill and its list are one box: no gap, one width, the chosen one not repeated", async ({
  page,
}, info) => {
  const panel = await settingsOn(page, "Camera");
  const pill = panel.getByRole("button", { name: "Camera: Webcam C920" });
  const list = panel.getByRole("menu", { name: "Camera" });
  const chevron = pill.locator("svg");
  await observe(page, info, { pill, list, chevron }, async () => {
    await pill.click();
    await page.waitForTimeout(300);
  });
  await expect.soft(pill).toHaveAttribute("aria-expanded", "true");
  await expect.soft(list.getByRole("menuitemradio")).toHaveText(OTHERS);
  await expect.soft(list.getByRole("menuitemradio", { name: "Webcam C920" })).toHaveCount(0);
  const p = await pill.boundingBox();
  const l = await list.boundingBox();
  expect.soft(Math.abs((l?.y ?? 0) - ((p?.y ?? 0) + (p?.height ?? 0)))).toBeLessThan(1);
  expect.soft(l?.x).toBe(p?.x);
  expect.soft(l?.width).toBe(p?.width);
  await expect.soft(chevron).toHaveCSS("transform", /matrix\(-1, .*, -1, 0, 0\)/);
});

test("F-pickers.3 after three and a half options the list scrolls inside itself", async ({ page }, info) => {
  const panel = await settingsOn(page, "Camera");
  const pill = panel.getByRole("button", { name: "Camera: Webcam C920" });
  const list = panel.getByRole("menu", { name: "Camera" });
  await observe(page, info, { pill, list }, async () => {
    await pill.click();
    await page.waitForTimeout(300);
  });
  const size = await list.evaluate((e) => ({ seen: e.clientHeight, all: e.scrollHeight }));
  const h = (await pill.boundingBox())?.height ?? 0;
  expect.soft(size.all).toBeGreaterThan(size.seen);
  expect.soft(Math.abs(size.seen - h * 3.5)).toBeLessThan(2);
});

test("F-pickers.4 picking an option puts it in the pill, rolls the list back and gives the pill the focus", async ({
  page,
}, info) => {
  const panel = await settingsOn(page, "Camera");
  await panel.getByRole("button", { name: "Camera: Webcam C920" }).click();
  const option = panel.getByRole("menuitemradio", { name: "Elgato Facecam" });
  const list = panel.getByRole("menu", { name: "Camera" });
  await observe(page, info, { option, list }, async () => {
    await option.click();
    await page.waitForTimeout(300);
  });
  const pill = panel.getByRole("button", { name: "Camera: Elgato Facecam" });
  await expect.soft(pill).toBeVisible();
  await expect.soft(pill).toBeFocused();
  await expect.soft(pill).toHaveAttribute("aria-expanded", "false");
  await expect.soft(list).toHaveCount(0);
});

test("F-pickers.5 the arrow keys open it and move through it; Escape closes it", async ({ page }, info) => {
  const panel = await settingsOn(page, "Camera");
  const pill = panel.getByRole("button", { name: "Camera: Webcam C920" });
  await pill.focus();
  const list = panel.getByRole("menu", { name: "Camera" });
  await observe(page, info, { pill, list }, async () => {
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(300);
  });
  await expect.soft(list.getByRole("menuitemradio", { name: OTHERS[0] })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect.soft(list.getByRole("menuitemradio", { name: OTHERS[1] })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect.soft(pill).toHaveAttribute("aria-expanded", "false");
  await expect.soft(list).toHaveCount(0);
  await expect.soft(panel).toBeVisible();
});

test("F-pickers.6 opening it in a panel moves nothing: the controls under it stay where they are", async ({
  page,
}, info) => {
  const panel = await settingsOn(page, "Camera");
  const pill = panel.getByRole("button", { name: "Camera: Webcam C920" });
  const quality = panel.getByRole("radiogroup", { name: "Camera quality" });
  const tabs = panel.getByRole("tablist");
  const seen = await observe(page, info, { pill, quality, tabs }, async () => {
    await pill.click();
    await page.waitForTimeout(300);
  });
  expect.soft(drift(seen.frames, "pill")).toBeLessThan(1);
  expect.soft(drift(seen.frames, "quality")).toBeLessThan(1);
  expect.soft(drift(seen.frames, "tabs")).toBeLessThan(1);
});

test("F-pickers.7 over the video, a drop-up's picker is glass and its list grows upward from the pill", async ({
  page,
}, info) => {
  await myCameraOn(page);
  const button = page.getByRole("button", { name: "Turn off your camera" });
  await pointAt(page, button);
  await page.waitForTimeout(400);
  const pill = page.getByRole("button", { name: "Camera: Webcam C920" });
  const list = page.getByRole("menu", { name: "Camera" });
  let place = { pill: { y: 0 }, list: { bottom: -1 }, bg: "" };
  await observe(
    page,
    info,
    { pill, list },
    async () => {
      await pointAt(page, pill);
      await pill.click();
      await page.waitForTimeout(350);
      place = {
        pill: { y: (await pill.boundingBox())?.y ?? 0 },
        list: await list.evaluate((e) => ({ bottom: e.getBoundingClientRect().bottom })),
        bg: await pill.evaluate((e) => getComputedStyle(e).backdropFilter),
      };
    },
    { settle: 100 },
  );
  expect.soft(Math.abs(place.list.bottom - place.pill.y)).toBeLessThan(1);
  expect.soft(place.bg).toBe("blur(8px)");
});

test("F-pickers.8 a segmented control: the dark pill slides to the chosen option, which goes bold", async ({
  page,
}, info) => {
  const panel = await settingsOn(page, "Screen");
  const group = panel.getByRole("radiogroup", { name: "Screen quality" });
  const slider = group.locator("span[aria-hidden]");
  const option = group.locator("label").filter({ hasText: "720p" });
  const seen = await observe(page, info, { slider, option }, async () => {
    await option.click();
    await page.waitForTimeout(300);
  });
  await expect.soft(group.getByRole("radio", { name: "720p" })).toBeChecked();
  await expect.soft(option).toHaveCSS("font-weight", "600");
  await expect.soft(option).toHaveCSS("color", COLOR.text);
  const s = await slider.boundingBox();
  const o = await option.boundingBox();
  expect.soft(Math.abs((s?.x ?? 0) + (s?.width ?? 0) / 2 - ((o?.x ?? 0) + (o?.width ?? 0) / 2))).toBeLessThan(1.5);
  expect.soft(blinks(seen.frames, "slider")).toEqual([]);
  // It slid: in between, it passed through places between the two options.
  const xs = seen.frames.map((f) => f.seen.slider?.box?.x ?? 0);
  expect.soft(new Set(xs.map(Math.round)).size).toBeGreaterThan(2);
});

test("F-pickers.9 an option pointed at gets a soft sideways light and white words; the chosen one doesn't react", async ({
  page,
}, info) => {
  const panel = await settingsOn(page, "Screen");
  const group = panel.getByRole("radiogroup", { name: "Screen mode" });
  const sharp = group.locator("label").filter({ hasText: "Sharp" });
  const smooth = group.locator("label").filter({ hasText: "Smooth" });
  await expect.soft(sharp).toHaveCSS("color", COLOR.muted);
  await observe(page, info, { sharp, smooth }, async () => {
    await pointAt(page, sharp);
    await page.waitForTimeout(250);
  });
  await expect.soft(sharp).toHaveCSS("color", COLOR.text);
  expect.soft(await pseudo(sharp, "::before", "opacity")).toBe("1");
  await pointAt(page, smooth);
  await page.waitForTimeout(250);
  expect.soft(await pseudo(smooth, "::before", "opacity")).toBe("0");
  await expect.soft(smooth).toHaveCSS("cursor", "default");
});

test("F-pickers.10 a segmented control is one tab stop, and the arrow keys move its choice", async ({ page }, info) => {
  const panel = await settingsOn(page, "Screen");
  const group = panel.getByRole("radiogroup", { name: "Screen quality" });
  const first = group.getByRole("radio", { name: "1080p" });
  await first.focus();
  await observe(page, info, { group }, async () => {
    await page.keyboard.press("ArrowRight");
  });
  await expect.soft(group.getByRole("radio", { name: "720p" })).toBeChecked();
  await expect.soft(group.getByRole("radio", { name: "720p" })).toBeFocused();
  await page.keyboard.press("Tab");
  const inGroup = await group.evaluate((g) => g.contains(document.activeElement));
  expect.soft(inGroup).toBe(false);
});

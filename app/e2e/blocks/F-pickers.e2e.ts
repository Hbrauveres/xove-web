import { expect, test } from "@playwright/test";
import { blinks, drift } from "../support/frames.ts";
import { observe } from "../support/observe.ts";
import { boxOf, centreX, overlap } from "../support/geometry.ts";
import { computed, LOOK, pxOf, SIZE, WEIGHT } from "../support/looks.ts";
import { pointAt, pointAway, restOn } from "../support/pointer.ts";
import { shownTip } from "../support/stage.ts";
import { TIP_REST_MS, untilStill } from "../support/timing.ts";
import { myCameraOn, pseudo, settingsOn } from "./where.ts";

const [FIRST, SECOND, ...REST] = [
  "MacBook Pro camera",
  "OBS Virtual Camera",
  "Elgato Facecam",
  "Iriun Webcam",
  "Continuity Camera",
] as const;
const OTHERS = [FIRST, SECOND, ...REST];
/** The harness's camera with a name too long for an option (`cams=long`). */
const LONG = "Logitech BRIO Ultra HD Pro Business Webcam (046d:085e)";
/** How many options the list shows before it scrolls: three and a half (picker-list's stylesheet). */
const SHOWN_OPTIONS = 3.5;

test("F-pickers.1 closed, a picker is a pill with the chosen option and a chevron", async ({ page }, info) => {
  const panel = await settingsOn(page, "Camera");
  const pill = panel.getByRole("button", { name: "Camera: Webcam C920" });
  await observe(page, info, { pill }, async () => {
    await pointAway(page);
  });
  await expect.soft(pill).toHaveText("Webcam C920");
  await expect.soft(pill).toHaveAttribute("aria-expanded", "false");
  await expect.soft(pill.locator('svg[data-icon="chevron"]')).toBeVisible();
  expect.soft((await boxOf(pill)).height).toBe(await pxOf(page, SIZE.panelControl));
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
    await list.waitFor();
  });
  await expect.soft(pill).toHaveAttribute("aria-expanded", "true");
  await expect.soft(list.getByRole("menuitemradio")).toHaveText(OTHERS);
  await expect.soft(list.getByRole("menuitemradio", { name: "Webcam C920" })).toHaveCount(0);
  const p = await boxOf(pill);
  const l = await boxOf(list);
  expect.soft(Math.abs(l.y - (p.y + p.height))).toBeLessThan(1);
  expect.soft(l.x).toBe(p.x);
  expect.soft(l.width).toBe(p.width);
  await expect.soft(chevron).toHaveCSS("transform", await computed(page, "transform", LOOK.flipped));
});

test("F-pickers.3 after three and a half options the list scrolls inside itself", async ({ page }, info) => {
  const panel = await settingsOn(page, "Camera");
  const pill = panel.getByRole("button", { name: "Camera: Webcam C920" });
  const list = panel.getByRole("menu", { name: "Camera" });
  await observe(page, info, { pill, list }, async () => {
    await pill.click();
    await list.waitFor();
  });
  const size = await list.evaluate((e) => ({ seen: e.clientHeight, all: e.scrollHeight }));
  const h = (await boxOf(pill)).height;
  expect.soft(size.all).toBeGreaterThan(size.seen);
  expect.soft(Math.abs(size.seen - h * SHOWN_OPTIONS)).toBeLessThan(2);
  // The app's one slim scrollbar (global.css; a headless browser draws none, so its mark is checked).
  await expect.soft(list).toHaveAttribute("data-scroll", "slim");
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
    await list.waitFor({ state: "detached" });
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
    await list.waitFor();
  });
  await expect.soft(list.getByRole("menuitemradio", { name: FIRST })).toBeFocused();
  // No tooltip over the pill: its chosen camera stays readable, and the focused option isn't said twice.
  const p = await boxOf(pill);
  const tips = await Promise.all((await shownTip(page).all()).map(boxOf));
  expect.soft(tips.some((tip) => overlap(tip, p))).toBe(false);
  await page.keyboard.press("ArrowDown");
  await expect.soft(list.getByRole("menuitemradio", { name: SECOND })).toBeFocused();
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
  // On a short window the panel scrolls: brought into view first, as a person would, so the drift
  // measured is the action's alone.
  await pill.scrollIntoViewIfNeeded();
  const seen = await observe(page, info, { pill, quality, tabs }, async () => {
    await pill.click();
    await panel.getByRole("menu", { name: "Camera" }).waitFor();
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
  const pill = page.getByRole("button", { name: "Camera: Webcam C920" });
  const list = page.getByRole("menu", { name: "Camera" });
  await pill.waitFor();
  await untilStill(page.getByRole("group", { name: "Your camera" }));
  let place = { pill: { y: 0 }, list: { bottom: -1 }, bg: "" };
  await observe(page, info, { pill, list }, async () => {
    await pointAt(page, pill);
    await pill.click();
    await list.waitFor();
    await untilStill(list);
    place = {
      pill: { y: (await boxOf(pill)).y },
      list: await list.evaluate((e) => ({ bottom: e.getBoundingClientRect().bottom })),
      bg: await pill.evaluate((e) => getComputedStyle(e).backdropFilter),
    };
  });
  expect.soft(Math.abs(place.list.bottom - place.pill.y)).toBeLessThan(1);
  expect.soft(place.bg).toBe(await computed(page, "backdrop-filter", LOOK.glassBlur));
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
    await expect(group.getByRole("radio", { name: "720p" })).toBeChecked();
  });
  await expect.soft(group.getByRole("radio", { name: "720p" })).toBeChecked();
  await expect.soft(option).toHaveCSS("font-weight", WEIGHT.semibold);
  await expect.soft(option).toHaveCSS("color", await computed(page, "color", LOOK.text));
  const s = await boxOf(slider);
  const o = await boxOf(option);
  expect.soft(Math.abs(centreX(s) - centreX(o))).toBeLessThan(1.5);
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
  await expect.soft(sharp).toHaveCSS("color", await computed(page, "color", LOOK.muted));
  await observe(page, info, { sharp, smooth }, async () => {
    await pointAt(page, sharp);
  });
  await expect.soft(sharp).toHaveCSS("color", await computed(page, "color", LOOK.text));
  expect.soft(await pseudo(sharp, "::before", "opacity")).toBe("1");
  await pointAt(page, smooth);
  await untilStill(group);
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

test("F-pickers.11 an option's tooltip says a cut name whole, beside the list; a whole name has none", async ({
  page,
}, info) => {
  const panel = await settingsOn(page, "Camera", "s=empty&cams=long");
  const pill = panel.getByRole("button", { name: "Camera: Webcam C920" });
  await pill.click();
  const list = panel.getByRole("menu", { name: "Camera" });
  await untilStill(list);
  const long = list.getByRole("menuitemradio", { name: LONG });
  const whole = list.getByRole("menuitemradio", { name: FIRST });
  await whole.scrollIntoViewIfNeeded();
  await restOn(page, whole, TIP_REST_MS);
  await expect.soft(shownTip(page)).toHaveCount(0);
  await long.scrollIntoViewIfNeeded();
  await observe(page, info, { long, list }, () => restOn(page, long, TIP_REST_MS));
  const tip = shownTip(page);
  await expect.soft(tip).toHaveText(LONG);
  // Beside the list, level with its option, never over the pill.
  const t = await boxOf(tip);
  const l = await boxOf(list);
  const o = await boxOf(long);
  expect.soft(t.x >= l.x + l.width || t.x + t.width <= l.x).toBe(true);
  expect.soft(Math.abs(t.y + t.height / 2 - (o.y + o.height / 2))).toBeLessThan(1);
  expect.soft(overlap(t, await boxOf(pill))).toBe(false);
});

import { expect, test, type Page } from "@playwright/test";
import { blinks, drift } from "../support/frames.ts";
import { observe } from "../support/observe.ts";
import { openScene, wakeStage } from "../support/open.ts";
import { boxOf, inside } from "../support/geometry.ts";
import { pictureWidth } from "../support/harness.ts";
import { clickAt, restOn } from "../support/pointer.ts";
import { control, pictureOf, shownTip } from "../support/stage.ts";
import { TIP_REST_MS } from "../support/timing.ts";

/** The picture made `width` px wide, as a stream that narrow would make it; then the controls woken. */
async function shapePicture(page: Page, width: number) {
  await pictureWidth(page, width);
  await wakeStage(page);
}

/** Picture widths (CSS px): too narrow for the whole bar, narrower still, and wide enough for it. */
const NARROW = 172;
const NARROWEST = 104;
const WIDE = 260;

/** Someone else's stream on a picture too narrow for the whole bar. */
async function openNarrow(page: Page, query = "s=live", width = NARROW) {
  await openScene(page, query);
  await wakeStage(page);
  await shapePicture(page, width);
}
const group = (page: Page) => page.getByRole("group", { name: "More controls" });

test("F-more-menu.1 on a narrow picture Go live and both sounds fold into …, fullscreen stays", async ({
  page,
}, info) => {
  await openScene(page, "s=live");
  await wakeStage(page);
  const more = control(page, "More controls");
  const full = control(page, "Fullscreen");
  const seen = await observe(page, info, { more, full }, () => shapePicture(page, NARROW));
  await expect.soft(more).toBeVisible();
  await expect.soft(full).toBeVisible();
  await expect.soft(control(page, "Go live")).toHaveCount(0);
  await expect.soft(control(page, "No sound in this stream")).toHaveCount(0);
  await expect.soft(control(page, "Marina's mic is off")).toHaveCount(0);
  expect.soft(inside(await boxOf(more), await boxOf(pictureOf(page)))).toBe(true);
  expect.soft(inside(await boxOf(full), await boxOf(pictureOf(page)))).toBe(true);
  const m = await boxOf(more);
  const f = await boxOf(full);
  expect.soft(m.x + m.width).toBeLessThanOrEqual(f.x);
  await expect.soft(more).toHaveAttribute("aria-expanded", "false");
  expect.soft(seen.after.full?.visible).toBe(true);
});

test("F-more-menu.2 a wider picture folds nothing", async ({ page }, info) => {
  await openScene(page, "s=live");
  await wakeStage(page);
  const goLive = control(page, "Go live");
  await observe(page, info, { goLive }, () => shapePicture(page, WIDE));
  await expect.soft(goLive).toBeVisible();
  await expect.soft(control(page, "More controls")).toHaveCount(0);
  expect.soft(inside(await boxOf(goLive), await boxOf(pictureOf(page)))).toBe(true);
});

test("F-more-menu.3 … opens its menu centred on the picture, holding what folded", async ({ page }, info) => {
  await openNarrow(page);
  const more = control(page, "More controls");
  const menu = group(page);
  // Pointed at, it says what it is.
  await restOn(page, more, TIP_REST_MS);
  await expect.soft(shownTip(page)).toHaveText("More");
  const seen = await observe(page, info, { more, menu }, async () => {
    await more.click();
  });
  await expect.soft(menu).toBeVisible();
  await expect.soft(more).toHaveAttribute("aria-expanded", "true");
  // Go live's rows, then the sounds, each with its slider.
  for (const name of ["Share your screen", "Turn on your camera", "Settings"])
    await expect.soft(menu.getByRole("button", { name, exact: true })).toBeVisible();
  await expect.soft(menu.getByRole("button", { name: "No sound in this stream" })).toBeVisible();
  await expect.soft(menu.getByRole("button", { name: "Marina's mic is off" })).toBeVisible();
  await expect.soft(menu.getByRole("slider")).toHaveCount(2);
  // Centred on the picture, reaching past both sides alike; above the bar; whole on the screen.
  const m = await boxOf(menu);
  const p = await boxOf(pictureOf(page));
  const b = await boxOf(more);
  expect.soft(Math.abs(m.x + m.width / 2 - (p.x + p.width / 2))).toBeLessThan(1);
  expect.soft(m.y + m.height).toBeLessThanOrEqual(b.y);
  await expect.soft(menu).toBeInViewport({ ratio: 1 });
  expect.soft(drift(seen.frames, "more")).toBeLessThan(1);
  expect.soft(blinks(seen.frames, "more")).toEqual([]);
});

test("F-more-menu.4 a folded sound mutes from …, its slider disabled while muted", async ({ page }, info) => {
  await openNarrow(page, "s=live&sound=1", NARROWEST);
  await control(page, "More controls").click();
  const menu = group(page);
  const sound = menu.getByRole("button", { name: /the screen's sound/ });
  const slider = menu.getByRole("slider", { name: "Screen sound volume" });
  await expect.soft(sound).toHaveAccessibleName("Mute the screen's sound");
  await expect.soft(slider).toBeEnabled();
  const seen = await observe(page, info, { sound, slider }, async () => {
    await sound.click();
  });
  await expect.soft(sound).toHaveAccessibleName("Unmute the screen's sound");
  await expect.soft(sound).toHaveAttribute("aria-pressed", "true");
  await expect.soft(slider).toBeDisabled();
  // The menu stays open while its sounds change.
  await expect.soft(menu).toBeVisible();
  await sound.click();
  await expect.soft(slider).toBeEnabled();
  expect.soft(drift(seen.frames, "sound")).toBeLessThan(1);
  expect.soft(blinks(seen.frames, "sound")).toEqual([]);
});

test("F-more-menu.5 a sound that can't be heard keeps its slider in …, disabled", async ({ page }, info) => {
  await openNarrow(page);
  await control(page, "More controls").click();
  const menu = group(page);
  const voice = menu.getByRole("button", { name: "Marina's mic is off" });
  const slider = menu.getByRole("slider", { name: "Marina's voice volume" });
  await observe(page, info, { voice, slider }, async () => {
    await clickAt(page, voice);
  });
  await expect.soft(voice).toHaveAttribute("aria-disabled", "true");
  await expect.soft(slider).toBeVisible();
  await expect.soft(slider).toBeDisabled();
  await expect.soft(menu.getByRole("slider", { name: "Screen sound volume" })).toBeDisabled();
  // A click on it says why, in the toast.
  await expect.soft(page.locator("output[aria-live]")).toContainText("Marina's mic is off");
});

test("F-more-menu.6 Settings from … opens the settings, and … closes", async ({ page }, info) => {
  await openNarrow(page);
  await control(page, "More controls").click();
  const item = group(page).getByRole("button", { name: "Settings", exact: true });
  const dialog = page.getByRole("dialog", { name: "Settings" });
  await observe(page, info, { item, dialog }, async () => {
    await item.click();
    await dialog.waitFor();
  });
  await expect.soft(dialog).toBeVisible();
  await expect.soft(group(page)).toHaveCount(0);
  await expect.soft(dialog).toBeInViewport({ ratio: 1 });
});

test("F-more-menu.7 Escape closes …'s menu", async ({ page }, info) => {
  await openNarrow(page);
  const more = control(page, "More controls");
  await more.click();
  await expect.soft(group(page)).toBeVisible();
  await observe(page, info, { more }, async () => {
    await page.keyboard.press("Escape");
  });
  await expect.soft(group(page)).toHaveCount(0);
  await expect.soft(more).toHaveAttribute("aria-expanded", "false");
});

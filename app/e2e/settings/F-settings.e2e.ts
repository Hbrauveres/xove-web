import { expect, test, type Locator, type Page } from "@playwright/test";
import { blinks, drift } from "../support/frames.ts";
import { openScene, wakeStage } from "../support/open.ts";
import { observe } from "../support/observe.ts";
import { ROW_GAP } from "../../src/features/room/components/stage/stage-player/constants/stage-player.constants.ts";
import { boxOf, centreX } from "../support/geometry.ts";
import { computed, LOOK, pxOf } from "../support/looks.ts";
import { pointAt } from "../support/pointer.ts";
import { patchOf } from "../support/screen.ts";
import { stageOf } from "../support/stage.ts";
import { untilStill } from "../support/timing.ts";
import { hide, myButtons, myStream, openSettings, panelOf, tabOf } from "./settings.ts";

/** Half a pixel of rounding, as the boxes allow. */
const ROUNDING = 0.5;

/**
 * The panel's place and width against the stage: above `anchor`, ROW_GAP px clear of it, centred on
 * it unless the stage's side holds it in (by its margin), a fifth of the player wide between the
 * settings' two widths (less only where the stage itself is narrower).
 */
async function sitsOver(page: Page, anchor: Locator, { width = true } = {}) {
  const p = await boxOf(panelOf(page));
  const a = await boxOf(anchor);
  const stage = await boxOf(stageOf(page));
  const margin = await pxOf(page, "var(--space-2-5)");
  expect.soft(a.y - (p.y + p.height)).toBeGreaterThanOrEqual(ROW_GAP - ROUNDING);
  expect.soft(p.x).toBeGreaterThanOrEqual(stage.x);
  expect.soft(p.x + p.width).toBeLessThanOrEqual(stage.x + stage.width + ROUNDING);
  const centred = Math.abs(centreX(p) - centreX(a));
  const heldIn = p.x - stage.x < margin + 1 || stage.x + stage.width - (p.x + p.width) < margin + 1;
  expect.soft(centred < 1 || heldIn).toBe(true);
  if (!width) return;
  const narrowest = await pxOf(page, "var(--settings-width)");
  const widest = await pxOf(page, "var(--settings-width-wide)");
  const room = stage.width - (await pxOf(page, "var(--size-5)"));
  expect.soft(p.width).toBeLessThanOrEqual(widest + ROUNDING);
  expect.soft(p.width).toBeGreaterThanOrEqual(Math.min(narrowest - ROUNDING, room));
}

test("F-settings.1 the cog opens the settings over itself, above my buttons", async ({ page }, info) => {
  await myStream(page);
  const { screen, camera, cog } = myButtons(page);
  const seen = await observe(page, info, { cog, screen, camera, cogIcon: cog.locator("svg") }, async () => {
    await cog.click();
    await panelOf(page).waitFor();
    await untilStill(panelOf(page));
  });
  const panel = panelOf(page);
  await expect.soft(panel).toBeVisible();
  await expect.soft(panel.getByRole("heading", { name: "Settings" })).toBeVisible();
  await expect.soft(panel.getByRole("tab")).toHaveText(["Screen", "Camera", "Voice"]);
  await expect.soft(tabOf(page, "Screen")).toHaveAttribute("aria-selected", "true");
  await expect.soft(tabOf(page, "Screen")).toBeFocused();
  // Above the round buttons, 10 px clear of them, inside the stage, centred on the cog unless the
  // stage's side holds it in; a fifth of the player wide, 280 to 320 px.
  await sitsOver(page, cog);
  for (const name of ["cog", "screen", "camera"]) expect.soft(drift(seen.frames, name)).toBeLessThan(1);
  expect.soft(blinks(seen.frames, "cogIcon")).toEqual([]);
});

test("F-settings.2 the glass hides the stream behind it, blurred and dimmed", async ({ page }, info) => {
  await myStream(page);
  await openSettings(page);
  const panel = panelOf(page);
  // The page as it is: recorded, the way it looks with the panel open.
  await observe(page, info, { panel }, async () => {
    await page.mouse.move(5, 5);
  });
  const look = await panel.evaluate((el) => {
    const s = getComputedStyle(el);
    return { filter: s.backdropFilter, background: s.backgroundColor, opacity: s.opacity };
  });
  // The panels' glass: blurred and dimmed (its filter), under a dark tint.
  expect.soft(look.filter).toBe(await computed(page, "backdrop-filter", LOOK.panelFilter));
  expect.soft(look.background).toBe(await computed(page, "background-color", LOOK.panel));
  expect.soft(look.opacity).toBe("1");
  // The same patch of the busy, still picture: without the panel, then through its glass alone.
  const p = await boxOf(panel);
  const inset = 24;
  const clip = { x: p.x + inset, y: p.y + inset, width: p.width - 2 * inset, height: p.height - 2 * inset };
  const showPanel = await hide(page, '[role="dialog"][aria-label="Settings"]');
  const behind = await patchOf(page, clip);
  await showPanel();
  const showContents = await hide(page, '[role="dialog"][aria-label="Settings"] *');
  const through = await patchOf(page, clip);
  await showContents();
  info.annotations.push({ type: "glass", description: JSON.stringify({ behind, through }) });
  // The picture behind is busy (its stripes), so there's something to hide.
  expect.soft(behind.spread).toBeGreaterThan(60);
  // Through the glass: darker (dimmed to about half and under a dark tint)...
  expect.soft(through.mean).toBeLessThan(behind.mean * 0.6);
  // ...and blurred: the stripes melt into a soft wash, no edge of theirs reads through.
  expect.soft(through.spread).toBeLessThan(behind.spread * 0.2);
  expect.soft(through.step).toBeLessThanOrEqual(6);
});

test("F-settings.3 another tab's click slides the marker; the tabs and the panel stay put", async ({ page }, info) => {
  await myStream(page);
  await openSettings(page);
  const panel = panelOf(page);
  const screenTab = tabOf(page, "Screen");
  const cameraTab = tabOf(page, "Camera");
  const voiceTab = tabOf(page, "Voice");
  const before = await boxOf(panel);
  const seen = await observe(page, info, { panel, screenTab, cameraTab, voiceTab }, async () => {
    await cameraTab.click();
  });
  await expect.soft(cameraTab).toHaveAttribute("aria-selected", "true");
  await expect.soft(screenTab).toHaveAttribute("aria-selected", "false");
  await expect.soft(panel.getByRole("tabpanel", { name: "Camera" })).toBeVisible();
  await expect.soft(panel.getByRole("tabpanel", { name: "Screen" })).toBeHidden();
  // The red marker sits under the chosen tab.
  const marker = await boxOf(panel.locator('[role="tablist"] > span[aria-hidden="true"]'));
  const tab = await boxOf(cameraTab);
  expect.soft(Math.abs(marker.x + marker.width / 2 - (tab.x + tab.width / 2))).toBeLessThan(1.5);
  // Every tab is as tall as the tallest: nothing moves under the pointer.
  const after = await boxOf(panel);
  expect.soft(after.height).toBeCloseTo(before.height, 0);
  for (const name of ["panel", "screenTab", "cameraTab", "voiceTab"])
    expect.soft(drift(seen.frames, name)).toBeLessThan(1);
  for (const name of ["screenTab", "cameraTab", "voiceTab"]) expect.soft(blinks(seen.frames, name)).toEqual([]);
});

test("F-settings.4 the arrow keys move between the tabs, round and round", async ({ page }, info) => {
  await myStream(page);
  await openSettings(page);
  const screenTab = tabOf(page, "Screen");
  const cameraTab = tabOf(page, "Camera");
  const voiceTab = tabOf(page, "Voice");
  await observe(page, info, { screenTab, cameraTab, voiceTab }, async () => {
    await page.keyboard.press("ArrowRight");
  });
  await expect.soft(cameraTab).toBeFocused();
  await expect.soft(cameraTab).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("ArrowRight");
  await expect.soft(voiceTab).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect.soft(screenTab).toBeFocused();
  await expect.soft(screenTab).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("ArrowLeft");
  await expect.soft(voiceTab).toBeFocused();
  await expect.soft(voiceTab).toHaveAttribute("aria-selected", "true");
  // One tab stop: only the chosen tab takes the Tab key.
  await expect.soft(page.locator('[role="tab"][tabindex="0"]')).toHaveCount(1);
});

test("F-settings.5 the ✕ closes the settings and gives the focus back to the cog", async ({ page }, info) => {
  await myStream(page);
  await openSettings(page);
  const panel = panelOf(page);
  const close = panel.getByRole("button", { name: "Close settings" });
  const { cog } = myButtons(page);
  const seen = await observe(page, info, { panel, cog }, async () => {
    await close.focus();
    await page.keyboard.press("Enter");
  });
  await expect.soft(panel).toHaveCount(0);
  await expect.soft(cog).toBeFocused();
  expect.soft(drift(seen.frames, "cog")).toBeLessThan(1);
});

test("F-settings.6 Escape closes the settings; the cog closes them too", async ({ page }, info) => {
  await myStream(page);
  await openSettings(page);
  const panel = panelOf(page);
  const { cog } = myButtons(page);
  await observe(page, info, { panel, cog }, async () => {
    await page.keyboard.press("Escape");
  });
  await expect.soft(panel).toHaveCount(0);
  await openSettings(page);
  await expect.soft(panel).toBeVisible();
  await wakeStage(page);
  await cog.click();
  await expect.soft(panel).toHaveCount(0);
});

test("F-settings.7 the red dot marks the tab of what I'm sending", async ({ page }, info) => {
  await myStream(page);
  await openSettings(page);
  const dotOf = (name: "Screen" | "Camera" | "Voice") => tabOf(page, name).locator("[data-live]");
  const cameraDot = dotOf("Camera");
  await expect.soft(dotOf("Screen")).toBeVisible();
  await expect.soft(cameraDot).toHaveCount(0);
  await expect.soft(dotOf("Voice")).toHaveCount(0);
  const { camera } = myButtons(page);
  const screenTab = tabOf(page, "Screen");
  const seen = await observe(page, info, { screenTab, cameraDot }, async () => {
    await camera.click();
    await page.getByRole("button", { name: "Turn off your camera" }).waitFor();
  });
  await expect.soft(cameraDot).toBeVisible();
  // The panel stays open, on its tab, while I start a stream from my buttons.
  await expect.soft(panelOf(page)).toBeVisible();
  await expect.soft(screenTab).toHaveAttribute("aria-selected", "true");
  expect.soft(drift(seen.frames, "screenTab")).toBeLessThan(1);
});

test("F-settings.8 from Go live's menu, over someone else's stream, the settings open over Go live", async ({
  page,
}, info) => {
  await openScene(page, "s=live");
  await wakeStage(page);
  const goLive = page.getByRole("button", { name: "Go live" });
  await goLive.click();
  const item = page.getByRole("menuitem", { name: "Settings" });
  await item.waitFor();
  const seen = await observe(page, info, { goLive }, async () => {
    await item.click();
    await panelOf(page).waitFor();
    await untilStill(panelOf(page));
  });
  const panel = panelOf(page);
  await expect.soft(panel).toBeVisible();
  await expect.soft(page.getByRole("menu")).toHaveCount(0);
  await expect
    .soft(panel.getByText("You're not sharing. These are used the next time you do;", { exact: false }))
    .toBeVisible();
  await expect.soft(panel.locator("[data-live]")).toHaveCount(0);
  await sitsOver(page, goLive, { width: false });
  expect.soft(drift(seen.frames, "goLive")).toBeLessThan(1);
});

test("F-settings.9 pointing at a tab lights its words; the chosen one stays lit", async ({ page }, info) => {
  await myStream(page);
  await openSettings(page);
  const cameraTab = tabOf(page, "Camera");
  const screenTab = tabOf(page, "Screen");
  const colour = (l: typeof cameraTab) => l.evaluate((el) => getComputedStyle(el).color);
  const rest = await colour(cameraTab);
  const chosen = await colour(screenTab);
  expect.soft(rest).not.toBe(chosen);
  const seen = await observe(page, info, { cameraTab, icon: cameraTab.locator("svg") }, async () => {
    await pointAt(page, cameraTab);
    await untilStill(cameraTab);
  });
  expect.soft(await colour(cameraTab)).toBe(chosen);
  // Pointing isn't choosing.
  await expect.soft(cameraTab).toHaveAttribute("aria-selected", "false");
  expect.soft(blinks(seen.frames, "icon")).toEqual([]);
  expect.soft(drift(seen.frames, "cameraTab")).toBeLessThan(1);
});

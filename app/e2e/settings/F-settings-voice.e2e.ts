import { expect, test, type Page } from "@playwright/test";
import { blinks, drift } from "../support/frames.ts";
import { observe } from "../support/observe.ts";
import { boxOf } from "../support/geometry.ts";
import { computed, cssOf, LOOK, pxOf, SIZE } from "../support/looks.ts";
import { restOn } from "../support/pointer.ts";
import { shownTip } from "../support/stage.ts";
import { HEAR_YOURSELF_MS, LOOK_EVERY_MS, METER_MS, TIP_REST_MS, untilStill } from "../support/timing.ts";
import { myButtons, myStream, openSettings, panelOf, tabOf } from "./settings.ts";

/** How long the countdown may take beyond its 5 s before the case fails (ms): a second's tick. */
const COUNTDOWN_SLACK_MS = 1000;

/** The Voice tab chosen and the panel still. */
async function onVoiceTab(page: Page) {
  await tabOf(page, "Voice").click();
  await expect(tabOf(page, "Voice")).toHaveAttribute("aria-selected", "true");
  await untilStill(panelOf(page));
}

/** The Voice tab of the settings, open over my stream; my voice turned on first if asked. */
async function voiceTab(page: Page, { voice = false } = {}) {
  await myStream(page);
  if (voice) {
    await myButtons(page).voice.click();
    await page.getByRole("button", { name: "Mute your voice" }).waitFor();
  }
  await openSettings(page);
  await onVoiceTab(page);
  return panelOf(page).getByRole("tabpanel", { name: "Voice" });
}

/** The mic's level, drawn in the sensitivity slider's track: its reading, 0 to 100 (its `--level`), and whether it's sent. */
const meterOf = (page: Page) => panelOf(page).getByRole("slider", { name: "Mic sensitivity" });
const levelOf = async (page: Page) => {
  const style = (await meterOf(page).getAttribute("style")) ?? "";
  return Number(/--level:\s*([\d.]+)%/.exec(style)?.[1] ?? 0);
};

test("F-settings-voice.1 the Voice tab holds the mic, its level and Test, and four processing switches", async ({
  page,
}, info) => {
  await myStream(page);
  await openSettings(page);
  const tab = tabOf(page, "Voice");
  const seen = await observe(page, info, { tab }, async () => {
    await tab.click();
  });
  const pane = panelOf(page).getByRole("tabpanel", { name: "Voice" });
  await expect.soft(pane.getByText("Microphone", { exact: true })).toBeVisible();
  await expect.soft(pane.getByRole("button", { name: "Microphone: Headset (USB)" })).toBeVisible();
  await expect.soft(pane.getByText("Mic level", { exact: true })).toBeVisible();
  await expect.soft(pane.getByRole("slider", { name: "Mic sensitivity" })).toBeVisible();
  await expect.soft(pane.getByText("Voice processing", { exact: true })).toBeVisible();
  await expect.soft(pane.getByRole("switch")).toHaveCount(4);
  await expect.soft(pane.getByRole("switch", { name: "Echo cancellation" })).toBeChecked();
  await expect.soft(pane.getByRole("switch", { name: "Noise suppression" })).toBeChecked();
  await expect.soft(pane.getByRole("switch", { name: "Automatic volume" })).toBeChecked();
  await expect.soft(pane.getByRole("switch", { name: "Voice isolation" })).not.toBeChecked();
  expect.soft(drift(seen.frames, "tab")).toBeLessThan(1);
});

test("F-settings-voice.2 with my voice off, Test is greyed and says why", async ({ page }, info) => {
  const pane = await voiceTab(page);
  const test_ = pane.getByRole("button", { name: "Test: hear yourself" });
  await expect.soft(test_).toBeDisabled();
  await observe(page, info, { test: test_ }, async () => {
    await restOn(page, test_, TIP_REST_MS);
  });
  await expect.soft(shownTip(page)).toHaveText("Turn your voice on to hear yourself");
  await expect.soft(meterOf(page)).not.toHaveAttribute("data-sent", "true");
  await expect.soft(tabOf(page, "Voice").locator("[data-live]")).toHaveCount(0);
});

test("F-settings-voice.3 with my voice on, the level moves and goes green over the line", async ({ page }, info) => {
  await voiceTab(page, { voice: true });
  const meter = meterOf(page);
  const levels: number[] = [];
  const sent: boolean[] = [];
  await observe(
    page,
    info,
    { meter },
    async () => {
      // Read at the meter's own pace until it has moved and been sent at least once.
      await expect
        .poll(
          async () => {
            levels.push(await levelOf(page));
            sent.push((await meter.getAttribute("data-sent")) === "true");
            return Math.max(...levels) > Math.min(...levels) && sent.includes(true);
          },
          { intervals: [METER_MS] },
        )
        .toBe(true);
    },
    { strip: 4, gap: 200 },
  );
  // It follows my voice: up and down.
  expect.soft(Math.max(...levels)).toBeGreaterThan(Math.min(...levels));
  // Over the line it's sent (green); it's been both while I spoke in phrases.
  expect.soft(sent).toContain(true);
  await expect.soft(tabOf(page, "Voice").locator("[data-live]")).toBeVisible();
  await expect.soft(panelOf(page).getByRole("button", { name: "Test: hear yourself" })).toBeEnabled();
});

test("F-settings-voice.4 Test plays my voice back for 5 s, counting down", async ({ page }, info) => {
  const pane = await voiceTab(page, { voice: true });
  const start = pane.getByRole("button", { name: "Test: hear yourself" });
  const button = pane.locator("[aria-pressed]").filter({ hasText: /Test|Stop/ });
  const before = await boxOf(button);
  const said: string[] = [];
  let pressed: string | null = null;
  let name: string | null = null;
  let look = { bg: "", color: "" };
  const seen = await observe(
    page,
    info,
    { button },
    async () => {
      await start.click();
      pressed = await button.getAttribute("aria-pressed");
      name = await button.getAttribute("aria-label");
      // Playing, it's white with dark words: readable (read once its colour has eased in).
      await untilStill(button);
      look = { bg: await cssOf(button, "background-color"), color: await cssOf(button, "color") };
      // What it says, read every frame until it's over (its 5 s).
      await expect
        .poll(
          async () => {
            const text = ((await button.textContent()) ?? "").trim();
            if (said.at(-1) !== text) said.push(text);
            return text === "Test" && said.length > 1;
          },
          { intervals: [LOOK_EVERY_MS], timeout: HEAR_YOURSELF_MS + COUNTDOWN_SLACK_MS },
        )
        .toBe(true);
    },
    { strip: 3, gap: 100 },
  );
  // While it plays, it's pressed and named for what a click does then.
  expect.soft(pressed).toBe("true");
  expect.soft(name).toBe("Stop hearing yourself");
  expect.soft(said).toEqual(["Stop · 5", "Stop · 4", "Stop · 3", "Stop · 2", "Stop · 1", "Test"]);
  await expect.soft(start).toHaveAttribute("aria-pressed", "false");
  // It grows from its end: its right edge, at the column's end, stays put.
  const sizes = seen.frames.map((f) => f.seen.button?.box).filter((b) => b);
  for (const b of sizes) if (b) expect.soft(Math.abs(b.x + b.w - (before.x + before.width))).toBeLessThan(1);
  expect.soft(look.bg).toBe(await computed(page, "background-color", LOOK.text));
  expect.soft(look.color).toBe(await computed(page, "color", LOOK.ground));
  // The dark pill in XS, beside the level.
  expect.soft(before.height).toBe(await pxOf(page, SIZE.pillXs));
});

test("F-settings-voice.5 a click on Stop ends the test at once", async ({ page }, info) => {
  const pane = await voiceTab(page, { voice: true });
  await pane.getByRole("button", { name: "Test: hear yourself" }).click();
  const stop = pane.getByRole("button", { name: "Stop hearing yourself" });
  await observe(page, info, { stop }, async () => {
    await stop.click();
  });
  await expect.soft(pane.getByRole("button", { name: "Test: hear yourself" })).toHaveAttribute("aria-pressed", "false");
});

test("F-settings-voice.6 a processing switch turns off with a click, remembered", async ({ page }, info) => {
  const pane = await voiceTab(page);
  const noise = pane.getByRole("switch", { name: "Noise suppression" });
  const echo = pane.getByRole("switch", { name: "Echo cancellation" });
  // On a short window the panel scrolls: brought into view first, as a person would, so the drift
  // measured is the action's alone.
  await noise.scrollIntoViewIfNeeded();
  const seen = await observe(page, info, { noise, echo }, async () => {
    await noise.click();
  });
  await expect.soft(noise).not.toBeChecked();
  await expect.soft(echo).toBeChecked();
  expect.soft(blinks(seen.frames, "echo")).toEqual([]);
  expect.soft(drift(seen.frames, "noise")).toBeLessThan(1);
  await page.keyboard.press("Escape");
  await openSettings(page);
  await onVoiceTab(page);
  await expect.soft(noise).not.toBeChecked();
});

test("F-settings-voice.7 the sensitivity line moves with the arrow keys", async ({ page }, info) => {
  const pane = await voiceTab(page);
  const slider = pane.getByRole("slider", { name: "Mic sensitivity" });
  const was = Number(await slider.inputValue());
  await slider.focus();
  await observe(page, info, { slider }, async () => {
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
  });
  const now = Number(await slider.inputValue());
  expect.soft(now).toBeCloseTo(was + 0.02, 2);
  // The line is the slider's own knob, so it is where the setting is; the level is drawn in its track.
  await expect.soft(meterOf(page)).toHaveAttribute("style", /--level:/);
});

test("F-settings-voice.8 the microphone picker picks another mic", async ({ page }, info) => {
  const pane = await voiceTab(page);
  const pill = pane.getByRole("button", { name: /^Microphone: / });
  await observe(page, info, { pill }, async () => {
    await pill.click();
    await page.getByRole("menu", { name: "Microphone" }).waitFor();
  });
  const option = page
    .getByRole("menu", { name: "Microphone" })
    .getByRole("menuitemradio", { name: "MacBook Pro microphone" });
  await expect.soft(option).toBeVisible();
  await option.click();
  await expect.soft(pill).toHaveAccessibleName("Microphone: MacBook Pro microphone");
});

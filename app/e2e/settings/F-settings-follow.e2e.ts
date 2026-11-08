import { expect, test, type Locator, type Page } from "@playwright/test";
import { drift } from "../support/frames.ts";
import { observe } from "../support/observe.ts";
import { restOn } from "../support/pointer.ts";
import { shownTip } from "../support/stage.ts";
import { OPEN_DELAY_MS, spend, untilStill } from "../support/timing.ts";
import { moveAway, myButtons, myStream, openSettings, optionOf, panelOf, tabOf } from "./settings.ts";

/** My screen and camera live, the settings open over them. */
async function bothLive(page: Page) {
  await myStream(page, "s=empty", { camera: true });
  await openSettings(page);
}

/** The cue on the Screen tab's Change, or on the Camera tab's picker. */
const cueOn = (page: Page, tab: "Screen" | "Camera") =>
  panelOf(page).getByRole("tabpanel", { name: tab }).locator("[data-cue]");

/** A drop-up unrolled over a live button. */
const unrolled = (page: Page) => page.locator('[data-dropup][data-open="true"]');

/** The pointer resting on one of my buttons as long as a drop-up waits, and what follows it over. */
async function restOnButton(page: Page, button: Locator) {
  await restOn(page, button, OPEN_DELAY_MS);
  await untilStill(panelOf(page));
}

/** Where the panel is: its chosen tab's name. */
const chosen = async (page: Page) =>
  ((await panelOf(page).getByRole("tab", { selected: true }).textContent()) ?? "").trim();

test("F-settings-follow.1 resting on my live camera button goes to the Camera tab and cues its picker", async ({
  page,
}, info) => {
  await bothLive(page);
  const { camera } = myButtons(page);
  const panel = panelOf(page);
  const seen = await observe(page, info, { camera, panel, cameraTab: tabOf(page, "Camera") }, async () => {
    await restOnButton(page, camera);
  });
  await expect.soft(tabOf(page, "Camera")).toHaveAttribute("aria-selected", "true");
  await expect.soft(cueOn(page, "Camera")).toHaveCount(1);
  // The picker's list opens with the cue round it.
  await expect.soft(panel.getByRole("button", { name: /^Camera: / })).toHaveAttribute("aria-expanded", "true");
  // The gesture went to the panel: no drop-up unrolls over the button.
  await expect.soft(unrolled(page)).toHaveCount(0);
  expect.soft(drift(seen.frames, "camera")).toBeLessThan(1);
  expect.soft(drift(seen.frames, "panel")).toBeLessThan(1);
});

test("F-settings-follow.2 resting on my live screen button goes to the Screen tab and cues Change", async ({
  page,
}, info) => {
  await bothLive(page);
  await tabOf(page, "Voice").click();
  await moveAway(page);
  const { screen } = myButtons(page);
  const seen = await observe(page, info, { screen, panel: panelOf(page) }, async () => {
    await restOnButton(page, screen);
  });
  await expect.soft(tabOf(page, "Screen")).toHaveAttribute("aria-selected", "true");
  await expect.soft(cueOn(page, "Screen")).toHaveCount(1);
  // The cue sits on Change itself.
  const change = panelOf(page).getByRole("button", { name: "Change" });
  await expect.soft(change.locator("[data-cue]")).toHaveCount(1);
  await expect.soft(unrolled(page)).toHaveCount(0);
  expect.soft(drift(seen.frames, "screen")).toBeLessThan(1);
});

test("F-settings-follow.3 camera, then screen, then camera again: the panel follows every time", async ({
  page,
}, info) => {
  await bothLive(page);
  const { screen, camera } = myButtons(page);
  const went: string[] = [];
  const cued: number[] = [];
  await observe(
    page,
    info,
    { screen, camera, panel: panelOf(page) },
    async () => {
      for (const [button, tab] of [
        [camera, "Camera"],
        [screen, "Screen"],
        [camera, "Camera"],
        [screen, "Screen"],
      ] as const) {
        await restOnButton(page, button);
        went.push(await chosen(page));
        cued.push(await cueOn(page, tab).count());
        await moveAway(page);
      }
    },
    { strip: 6, gap: 300 },
  );
  expect.soft(went).toEqual(["Camera", "Screen", "Camera", "Screen"]);
  expect.soft(cued).toEqual([1, 1, 1, 1]);
});

test("F-settings-follow.4 the same button twice cues its control again", async ({ page }, info) => {
  await bothLive(page);
  const { screen } = myButtons(page);
  await restOnButton(page, screen);
  const first = await cueOn(page, "Screen").elementHandle();
  await moveAway(page);
  await observe(page, info, { screen }, async () => {
    await restOnButton(page, screen);
  });
  await expect.soft(cueOn(page, "Screen")).toHaveCount(1);
  // Drawn anew for the request: a new ring, pulsing again.
  const again = await cueOn(page, "Screen").elementHandle();
  const same = first && again ? await page.evaluate(([a, b]) => a === b, [first, again] as const) : true;
  expect.soft(same).toBe(false);
});

test("F-settings-follow.5 a press elsewhere puts the cue out", async ({ page }, info) => {
  await bothLive(page);
  const { screen } = myButtons(page);
  await restOnButton(page, screen);
  await expect.soft(cueOn(page, "Screen")).toHaveCount(1);
  const option = optionOf(page, "Screen mode", "Sharp");
  await observe(page, info, { option }, async () => {
    await option.click();
  });
  await expect.soft(cueOn(page, "Screen")).toHaveCount(0);
  // The panel stays, on its tab.
  await expect.soft(tabOf(page, "Screen")).toHaveAttribute("aria-selected", "true");
});

test("F-settings-follow.6 the keyboard's focus on a live button doesn't move the panel", async ({ page }, info) => {
  await bothLive(page);
  await tabOf(page, "Voice").click();
  const { camera } = myButtons(page);
  await observe(page, info, { camera, voiceTab: tabOf(page, "Voice") }, async () => {
    await camera.focus();
    // As long as a resting pointer would take to move it.
    await spend(page, OPEN_DELAY_MS);
  });
  await expect.soft(tabOf(page, "Voice")).toHaveAttribute("aria-selected", "true");
  await expect.soft(panelOf(page).locator("[data-cue]")).toHaveCount(0);
  await expect.soft(unrolled(page)).toHaveCount(0);
});

test("F-settings-follow.7 resting on a stream that's off moves nothing; its tooltip says what a click does", async ({
  page,
}, info) => {
  await myStream(page);
  await openSettings(page);
  await tabOf(page, "Voice").click();
  const { camera } = myButtons(page);
  await observe(page, info, { camera, voiceTab: tabOf(page, "Voice") }, async () => {
    await restOnButton(page, camera);
  });
  await expect.soft(tabOf(page, "Voice")).toHaveAttribute("aria-selected", "true");
  await expect.soft(panelOf(page).locator("[data-cue]")).toHaveCount(0);
  await expect.soft(shownTip(page)).toHaveText("Turn on your camera");
});

test("F-settings-follow.8 with the camera's list opened by a click, a rest on my screen closes it and follows", async ({
  page,
}, info) => {
  await bothLive(page);
  await tabOf(page, "Camera").click();
  const picker = panelOf(page).getByRole("button", { name: /^Camera: / });
  await picker.click();
  await expect(picker).toHaveAttribute("aria-expanded", "true");
  const { screen } = myButtons(page);
  await observe(page, info, { screen, panel: panelOf(page) }, async () => {
    await restOnButton(page, screen);
  });
  // The list closed: nothing in the panel is left open (the camera's tab, hidden now, included).
  await expect.soft(panelOf(page).locator('[aria-expanded="true"]')).toHaveCount(0);
  await expect.soft(tabOf(page, "Screen")).toHaveAttribute("aria-selected", "true");
  await expect.soft(cueOn(page, "Screen")).toHaveCount(1);
  await expect.soft(unrolled(page)).toHaveCount(0);
});

import { expect, test } from "@playwright/test";
import { blinks, drift } from "../support/frames.ts";
import { openScene } from "../support/open.ts";
import { observe } from "../support/observe.ts";
import { boxOf, centreY } from "../support/geometry.ts";
import { computed, FADED, LOOK, pxOf, SIZE, WEIGHT } from "../support/looks.ts";
import { pointAt, pointAway, tabTo } from "../support/pointer.ts";
import { openMyMenu, settingsOn } from "./where.ts";

test("F-form-controls.1 a switch: on, its knob red at the right; a click turns it off, the knob grey sliding left", async ({
  page,
}, info) => {
  const menu = await openMyMenu(page);
  const ambilight = menu.getByRole("switch", { name: "Ambilight" });
  const knob = ambilight.locator("i");
  await expect.soft(ambilight).toHaveAttribute("aria-checked", "true");
  await expect.soft(knob).toHaveCSS("background-color", await computed(page, "background-color", LOOK.accent));
  await expect.soft(knob).toHaveCSS("transform", await computed(page, "transform", `translateX(${SIZE.knobTravel})`));
  const seen = await observe(page, info, { ambilight, knob }, async () => {
    await ambilight.click();
    await expect(ambilight).toHaveAttribute("aria-checked", "false");
  });
  await expect.soft(ambilight).toHaveAttribute("aria-checked", "false");
  await expect.soft(knob).toHaveCSS("background-color", await computed(page, "background-color", LOOK.knobOff));
  await expect.soft(knob).toHaveCSS("transform", "none");
  expect.soft(blinks(seen.frames, "knob")).toEqual([]);
  expect.soft(drift(seen.frames, "ambilight")).toBeLessThan(1);
  // Its box keeps a 36 × 20 px target.
  expect.soft(seen.after.ambilight?.box?.w).toBe(await pxOf(page, SIZE.switchWidth));
  expect.soft(seen.after.ambilight?.box?.h).toBe(await pxOf(page, SIZE.switchHeight));
});

test("F-form-controls.2 a switch's words sit on its line, and the keyboard's focus draws a white ring", async ({
  page,
}, info) => {
  const menu = await openMyMenu(page);
  const ambilight = menu.getByRole("switch", { name: "Ambilight" });
  await observe(page, info, { ambilight }, async () => {
    await tabTo(page, ambilight);
  });
  await expect.soft(ambilight).toBeFocused();
  await expect.soft(ambilight).toHaveCSS("outline", await computed(page, "outline", LOOK.whiteRing));
  await page.keyboard.press("Space");
  await expect.soft(ambilight).toHaveAttribute("aria-checked", "false");
  const words = menu.getByText("Ambilight", { exact: true });
  expect.soft(Math.abs(centreY(await boxOf(words)) - centreY(await boxOf(ambilight)))).toBeLessThan(2);
});

test("F-form-controls.3 a slider: the arrow keys move it, the white filling up to its knob", async ({ page }, info) => {
  const menu = await openMyMenu(page);
  const slider = menu.getByRole("slider", { name: "Ambilight brightness" });
  await expect.soft(slider).toHaveValue("0.9");
  expect.soft(await slider.evaluate((e) => e.style.getPropertyValue("--fill"))).toBe("87.5%");
  await observe(page, info, { slider }, async () => {
    await slider.focus();
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
  });
  await expect.soft(slider).toHaveValue("0.8");
  expect.soft(await slider.evaluate((e) => e.style.getPropertyValue("--fill"))).toBe("75%");
  await expect.soft(slider).toHaveCSS("outline", await computed(page, "outline", LOOK.whiteRing));
});

test("F-form-controls.4 a slider whose setting is off is greyed and can't be moved", async ({ page }, info) => {
  const menu = await openMyMenu(page);
  const slider = menu.getByRole("slider", { name: "Ambilight brightness" });
  await observe(page, info, { slider }, async () => {
    await menu.getByRole("switch", { name: "Ambilight" }).click();
  });
  await expect.soft(slider).toBeDisabled();
  await expect.soft(slider).toHaveCSS("opacity", FADED.unavailable);
});

test("F-form-controls.5 a field: its label at the box's edge, the counter under the box, the form's button at the row's end", async ({
  page,
}, info) => {
  await openScene(page, "page=request");
  const box = page.getByRole("textbox", { name: "Message (optional)" });
  const label = page.locator("label[for=access-message]");
  const counter = page.getByText("0/500", { exact: true });
  const send = page.getByRole("button", { name: "Request access" });
  await observe(page, info, { box, label, counter, send }, async () => {
    await pointAway(page);
  });
  const b = await boxOf(box);
  const l = await boxOf(label);
  const c = await boxOf(counter);
  const s = await boxOf(send);
  expect.soft(Math.abs(l.x - b.x)).toBeLessThan(0.5);
  expect.soft(l.y + l.height).toBeLessThanOrEqual(b.y);
  expect.soft(c.y).toBeGreaterThanOrEqual(b.y + b.height);
  expect.soft(Math.abs(s.x + s.width - (b.x + b.width))).toBeLessThan(0.5);
  await expect.soft(counter).toHaveCSS("font-family", await computed(page, "font-family", LOOK.fontMono));
  await expect.soft(label).toHaveCSS("font-weight", WEIGHT.semibold);
  await expect.soft(label.getByText("(optional)")).toHaveCSS("color", await computed(page, "color", LOOK.muted));
});

test("F-form-controls.6 a field takes the keyboard with a red ring", async ({ page }, info) => {
  await openScene(page, "page=request");
  const box = page.getByRole("textbox", { name: "Message (optional)" });
  await observe(page, info, { box }, async () => {
    await page.keyboard.press("Tab");
  });
  await expect.soft(box).toBeFocused();
  await expect.soft(box).toHaveCSS("outline", await computed(page, "outline", LOOK.focusRing));
});

test("F-form-controls.7 the primary button: red with deep-red words, lighter when pointed at, 1 px down while pressed", async ({
  page,
}, info) => {
  await openScene(page, "page=request");
  const send = page.getByRole("button", { name: "Request access" });
  await expect.soft(send).toHaveCSS("background-color", await computed(page, "background-color", LOOK.accent));
  await expect.soft(send).toHaveCSS("color", await computed(page, "color", LOOK.accentInk));
  await expect.soft(send).toHaveCSS("font-weight", WEIGHT.semibold);
  const seen = await observe(page, info, { send }, async () => {
    await pointAt(page, send);
  });
  await expect.soft(send).toHaveCSS("background-color", await computed(page, "background-color", LOOK.accentLight));
  expect.soft(drift(seen.frames, "send")).toBeLessThan(1);
  await page.mouse.down();
  await expect.soft(send).toHaveCSS("transform", await computed(page, "transform", `translateY(${SIZE.pressed})`));
  await pointAway(page);
  await page.mouse.up();
});

test("F-form-controls.8 ghost and danger buttons: clear with a border, the ghost lighting when pointed at, danger in red", async ({
  page,
}, info) => {
  await openScene(page, "page=admin");
  const decline = page.getByRole("button", { name: "Decline" });
  const clear = await computed(page, "background-color", LOOK.clear);
  await expect.soft(decline).toHaveCSS("background-color", clear);
  await expect.soft(decline).toHaveCSS("border-color", await computed(page, "border-color", LOOK.line));
  await expect.soft(decline).toHaveCSS("color", await computed(page, "color", LOOK.muted));
  await observe(page, info, { decline }, async () => {
    await pointAt(page, decline);
  });
  await expect.soft(decline).toHaveCSS("color", await computed(page, "color", LOOK.text));
  await expect.soft(decline).toHaveCSS("background-color", await computed(page, "background-color", LOOK.raised));
  await page.getByRole("button", { name: "Remove", exact: true }).click();
  const remove = page.getByRole("button", { name: "Remove Rafa" });
  await expect.soft(remove).toHaveCSS("color", await computed(page, "color", LOOK.accent));
  await expect.soft(remove).toHaveCSS("background-color", clear);
  await expect.soft(remove).toHaveCSS("border-top-style", "solid");
});

test("F-form-controls.9 a control's name over it in a panel: 11 px muted capitals", async ({ page }, info) => {
  const panel = await settingsOn(page, "Screen");
  const quality = panel.getByRole("tabpanel", { name: "Screen" }).getByText("Quality", { exact: true });
  await observe(page, info, { quality }, async () => {
    await pointAway(page);
  });
  await expect.soft(quality).toHaveCSS("text-transform", "uppercase");
  await expect.soft(quality).toHaveCSS("font-size", await computed(page, "font-size", SIZE.labelText));
  await expect.soft(quality).toHaveCSS("color", await computed(page, "color", LOOK.muted));
  const q = await boxOf(quality);
  const g = await boxOf(panel.getByRole("radiogroup", { name: "Screen quality" }));
  expect.soft(q.y + q.height).toBeLessThanOrEqual(g.y);
});

test("F-form-controls.10 a switch in a list is the settings row: 30 px, its switch 12 px from the end, alike everywhere", async ({
  page,
}, info) => {
  const rows: { h: number; end: number }[] = [];
  const measure = async (sw: ReturnType<typeof page.getByRole>) => {
    const row = sw.locator("xpath=ancestor::label[1]");
    const [r, s] = [await boxOf(row), await boxOf(sw)];
    rows.push({ h: r.height, end: r.x + r.width - (s.x + s.width) });
  };
  const menu = await openMyMenu(page);
  const ambilight = menu.getByRole("switch", { name: "Ambilight" });
  await observe(page, info, { ambilight }, async () => {
    await measure(ambilight);
  });
  const voice = await settingsOn(page, "Voice");
  await measure(voice.getByRole("switch", { name: "Noise suppression" }));
  const [h, end] = [await pxOf(page, SIZE.panelControl), await pxOf(page, SIZE.rowEnd)];
  for (const r of rows) {
    expect.soft(r.h).toBe(h);
    expect.soft(Math.abs(r.end - end)).toBeLessThan(1);
  }
});

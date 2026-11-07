import { expect, test } from "@playwright/test";
import { blinks, drift } from "../support/frames.ts";
import { openScene } from "../support/open.ts";
import { observe } from "../support/observe.ts";
import { COLOR, myMenu, pointAt, settingsOn, tabTo } from "./where.ts";

test("F-form-controls.1 a switch: on, its knob red at the right; a click turns it off, the knob grey sliding left", async ({
  page,
}, info) => {
  const menu = await myMenu(page);
  const ambilight = menu.getByRole("switch", { name: "Ambilight" });
  const knob = ambilight.locator("i");
  await expect.soft(ambilight).toHaveAttribute("aria-checked", "true");
  await expect.soft(knob).toHaveCSS("background-color", COLOR.accent);
  await expect.soft(knob).toHaveCSS("transform", "matrix(1, 0, 0, 1, 20, 0)");
  const seen = await observe(page, info, { ambilight, knob }, async () => {
    await ambilight.click();
    await page.waitForTimeout(250);
  });
  await expect.soft(ambilight).toHaveAttribute("aria-checked", "false");
  await expect.soft(knob).toHaveCSS("background-color", "rgb(189, 189, 192)");
  await expect.soft(knob).toHaveCSS("transform", "none");
  expect.soft(blinks(seen.frames, "knob")).toEqual([]);
  expect.soft(drift(seen.frames, "ambilight")).toBeLessThan(1);
  // Its box keeps a 36 × 20 px target.
  expect.soft(seen.after.ambilight?.box?.w).toBe(36);
  expect.soft(seen.after.ambilight?.box?.h).toBe(20);
});

test("F-form-controls.2 a switch's words sit on its line, and the keyboard's focus draws a white ring", async ({
  page,
}, info) => {
  const menu = await myMenu(page);
  const ambilight = menu.getByRole("switch", { name: "Ambilight" });
  await observe(page, info, { ambilight }, async () => {
    await tabTo(page, ambilight);
  });
  await expect.soft(ambilight).toBeFocused();
  await expect.soft(ambilight).toHaveCSS("outline", `${COLOR.text} solid 2px`);
  await page.keyboard.press("Space");
  await expect.soft(ambilight).toHaveAttribute("aria-checked", "false");
  const words = menu.getByText("Ambilight", { exact: true });
  const w = await words.boundingBox();
  const s = await ambilight.boundingBox();
  expect.soft(Math.abs((w?.y ?? 0) + (w?.height ?? 0) / 2 - ((s?.y ?? 0) + (s?.height ?? 0) / 2))).toBeLessThan(2);
});

test("F-form-controls.3 a slider: the arrow keys move it, the white filling up to its knob", async ({ page }, info) => {
  const menu = await myMenu(page);
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
  await expect.soft(slider).toHaveCSS("outline", `${COLOR.text} solid 2px`);
});

test("F-form-controls.4 a slider whose setting is off is greyed and can't be moved", async ({ page }, info) => {
  const menu = await myMenu(page);
  const slider = menu.getByRole("slider", { name: "Ambilight brightness" });
  await observe(page, info, { slider }, async () => {
    await menu.getByRole("switch", { name: "Ambilight" }).click();
  });
  await expect.soft(slider).toBeDisabled();
  await expect.soft(slider).toHaveCSS("opacity", "0.4");
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
    await page.mouse.move(2, 2);
  });
  const b = await box.boundingBox();
  const l = await label.boundingBox();
  const c = await counter.boundingBox();
  const s = await send.boundingBox();
  expect.soft(Math.abs((l?.x ?? 0) - (b?.x ?? 0))).toBeLessThan(0.5);
  expect.soft((l?.y ?? 0) + (l?.height ?? 0)).toBeLessThanOrEqual(b?.y ?? 0);
  expect.soft(c?.y ?? 0).toBeGreaterThanOrEqual((b?.y ?? 0) + (b?.height ?? 0));
  expect.soft(Math.abs((s?.x ?? 0) + (s?.width ?? 0) - ((b?.x ?? 0) + (b?.width ?? 0)))).toBeLessThan(0.5);
  await expect.soft(counter).toHaveCSS("font-family", /IBM Plex Mono/);
  await expect.soft(label).toHaveCSS("font-weight", "600");
  await expect.soft(label.getByText("(optional)")).toHaveCSS("color", COLOR.muted);
});

test("F-form-controls.6 a field takes the keyboard with a red ring", async ({ page }, info) => {
  await openScene(page, "page=request");
  const box = page.getByRole("textbox", { name: "Message (optional)" });
  await observe(page, info, { box }, async () => {
    await page.keyboard.press("Tab");
  });
  await expect.soft(box).toBeFocused();
  await expect.soft(box).toHaveCSS("outline", `${COLOR.accent} solid 2px`);
});

test("F-form-controls.7 the primary button: red with deep-red words, lighter when pointed at, 1 px down while pressed", async ({
  page,
}, info) => {
  await openScene(page, "page=request");
  const send = page.getByRole("button", { name: "Request access" });
  await expect.soft(send).toHaveCSS("background-color", COLOR.accent);
  await expect.soft(send).toHaveCSS("color", COLOR.accentInk);
  await expect.soft(send).toHaveCSS("font-weight", "600");
  const seen = await observe(page, info, { send }, async () => {
    await pointAt(page, send);
  });
  await expect.soft(send).toHaveCSS("background-color", COLOR.accentLight);
  expect.soft(drift(seen.frames, "send")).toBeLessThan(1);
  await page.mouse.down();
  await expect.soft(send).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 1)");
  await page.mouse.move(2, 2);
  await page.mouse.up();
});

test("F-form-controls.8 ghost and danger buttons: clear with a border, the ghost lighting when pointed at, danger in red", async ({
  page,
}, info) => {
  await openScene(page, "page=admin");
  const decline = page.getByRole("button", { name: "Decline" });
  await expect.soft(decline).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect.soft(decline).toHaveCSS("border-color", "rgb(44, 44, 47)");
  await expect.soft(decline).toHaveCSS("color", COLOR.muted);
  await observe(page, info, { decline }, async () => {
    await pointAt(page, decline);
  });
  await expect.soft(decline).toHaveCSS("color", COLOR.text);
  await expect.soft(decline).toHaveCSS("background-color", "rgb(27, 27, 29)");
  await page.getByRole("button", { name: "Remove", exact: true }).click();
  const remove = page.getByRole("button", { name: "Remove Rafa" });
  await expect.soft(remove).toHaveCSS("color", COLOR.accent);
  await expect.soft(remove).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect.soft(remove).toHaveCSS("border-top-style", "solid");
});

test("F-form-controls.9 a control's name over it in a panel: 11 px muted capitals", async ({ page }, info) => {
  const panel = await settingsOn(page, "Screen");
  const quality = panel.getByRole("tabpanel", { name: "Screen" }).getByText("Quality", { exact: true });
  await observe(page, info, { quality }, async () => {
    await page.mouse.move(2, 2);
  });
  await expect.soft(quality).toHaveCSS("text-transform", "uppercase");
  await expect.soft(quality).toHaveCSS("font-size", "11px");
  await expect.soft(quality).toHaveCSS("color", COLOR.muted);
  const q = await quality.boundingBox();
  const g = await panel.getByRole("radiogroup", { name: "Screen quality" }).boundingBox();
  expect.soft((q?.y ?? 0) + (q?.height ?? 0)).toBeLessThanOrEqual(g?.y ?? 0);
});

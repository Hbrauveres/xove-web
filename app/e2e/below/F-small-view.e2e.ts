import { expect, test, type Page } from "@playwright/test";
import { blinks, drift } from "../support/frames.ts";
import { observe } from "../support/observe.ts";
import { boxOf, inside, overlap } from "../support/geometry.ts";
import { pictureWidth } from "../support/harness.ts";
import { openScene, wakeStage } from "../support/open.ts";
import { focusedName, pointAt } from "../support/pointer.ts";
import { shownOpacity } from "../support/screen.ts";
import { chromeOf, pictureOf, stageOf } from "../support/stage.ts";
import { untilStill } from "../support/timing.ts";
import { smallViewOf } from "./below.ts";

/** The small view's width on a picture this wide: a quarter, else 200 px, else the whole picture. */
const widthOn = (picture: number) => Math.max(0.24 * picture, Math.min(200, picture));

const opened = async (page: Page) => {
  await openScene(page, "s=facecam");
  await wakeStage(page);
};

/** The picture made `width` px wide, as a stream that narrow would make it; then the controls woken. */
async function narrowPicture(page: Page, width: number) {
  await pictureWidth(page, width);
  await wakeStage(page);
}

test("F-small-view.1 it starts at the picture's top right, sized by the picture", async ({ page }, info) => {
  await openScene(page, "s=facecam");
  const view = smallViewOf(page);
  const seen = await observe(page, info, { view }, async () => {
    await wakeStage(page);
  });
  await expect
    .soft(page.getByRole("application", { name: "Marina's camera: drag or use the arrow keys to move it" }))
    .toBeVisible();
  await expect.soft(view).toHaveAttribute("aria-roledescription", "small view");
  const pic = await boxOf(pictureOf(page));
  const sv = await boxOf(view);
  expect.soft(inside(sv, pic)).toBe(true);
  expect.soft(Math.abs(sv.width - widthOn(pic.width))).toBeLessThan(1.5);
  expect.soft(Math.abs(sv.width / sv.height - 16 / 9)).toBeLessThan(0.02);
  // In the top right: its middle right of the picture's middle, its top in the picture's top tenth.
  expect.soft(sv.x + sv.width / 2).toBeGreaterThan(pic.x + pic.width / 2);
  expect.soft(sv.y - pic.y).toBeLessThan(pic.height / 10);
  for (const name of ["Fullscreen", "Go live"]) {
    expect.soft(overlap(sv, await boxOf(page.getByRole("button", { name })))).toBe(false);
  }
  expect.soft(blinks(seen.frames, "view")).toEqual([]);
  expect.soft(drift(seen.frames, "view")).toBeLessThan(1);
});

test("F-small-view.2 on a narrower picture it keeps 200 px, then the picture's whole width", async ({ page }, info) => {
  await opened(page);
  const view = smallViewOf(page);
  await observe(page, info, { view, picture: pictureOf(page) }, async () => {
    await narrowPicture(page, 400);
  });
  const p1 = await boxOf(pictureOf(page));
  const s1 = await boxOf(view);
  expect.soft(Math.abs(s1.width - widthOn(p1.width))).toBeLessThan(1.5);
  expect.soft(inside(s1, p1)).toBe(true);
  await narrowPicture(page, 150);
  const p2 = await boxOf(pictureOf(page));
  const s2 = await boxOf(view);
  expect.soft(Math.abs(s2.width - p2.width)).toBeLessThan(1.5);
  expect.soft(inside(s2, p2)).toBe(true);
  await expect.soft(page.getByRole("button", { name: "Swap views" })).toBeVisible();
  await expect.soft(page.getByRole("button", { name: "Hide the small view" })).toBeVisible();
});

test("F-small-view.3 dragging moves it with the pointer, kept whole inside the picture", async ({ page }, info) => {
  await opened(page);
  const view = smallViewOf(page);
  const pic = await boxOf(pictureOf(page));
  const start = await boxOf(view);
  const dx = -pic.width / 5;
  const dy = pic.height / 10;
  const from = { x: start.x + 10, y: start.y + start.height - 10 };
  await observe(page, info, { view }, async () => {
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(from.x + dx, from.y + dy, { steps: 8 });
    await page.mouse.up();
  });
  const moved = await boxOf(view);
  expect.soft(Math.abs(moved.x - (start.x + dx))).toBeLessThan(1.5);
  expect.soft(Math.abs(moved.y - (start.y + dy))).toBeLessThan(1.5);
  // Dragged far past the picture's bottom-left corner: it stops in that corner, whole.
  await page.mouse.move(moved.x + 10, moved.y + 10);
  await page.mouse.down();
  await page.mouse.move(moved.x - pic.width, moved.y + pic.height * 2, { steps: 8 });
  await page.mouse.up();
  const far = await boxOf(view);
  expect.soft(Math.abs(far.x - pic.x)).toBeLessThan(1);
  expect.soft(Math.abs(far.y + far.height - (pic.y + pic.height))).toBeLessThan(1);
  expect.soft(inside(far, pic)).toBe(true);
});

test("F-small-view.4 the arrow keys move it a twentieth of the picture, never past its edge", async ({
  page,
}, info) => {
  await opened(page);
  const view = smallViewOf(page);
  const pic = await boxOf(pictureOf(page));
  await view.focus();
  const start = await boxOf(view);
  await observe(page, info, { view }, async () => {
    await page.keyboard.press("ArrowLeft");
  });
  const left = await boxOf(view);
  expect.soft(Math.abs(start.x - left.x - pic.width * 0.05)).toBeLessThan(1);
  expect.soft(left.y).toBeCloseTo(start.y, 0);
  // Up from near the top: it stops at the picture's top edge, and stays there.
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowUp");
  expect.soft(Math.abs((await boxOf(view)).y - pic.y)).toBeLessThan(1);
  // Right, again and again: it stops at the picture's right edge.
  for (let i = 0; i < 4; i++) await page.keyboard.press("ArrowRight");
  const right = await boxOf(view);
  expect.soft(Math.abs(right.x + right.width - (pic.x + pic.width))).toBeLessThan(1);
  expect.soft(inside(right, pic)).toBe(true);
  await expect
    .soft(page.getByRole("application", { name: "Marina's camera: drag or use the arrow keys to move it" }))
    .toBeFocused();
});

test("F-small-view.5 Swap views trades the camera and the screen, the small view staying put", async ({
  page,
}, info) => {
  await opened(page);
  const view = smallViewOf(page);
  const swap = page.getByRole("button", { name: "Swap views" });
  const seen = await observe(page, info, { view, swap }, async () => {
    await swap.click();
  });
  await expect
    .soft(page.getByRole("application", { name: "Marina's shared screen: drag or use the arrow keys to move it" }))
    .toBeVisible();
  await expect.soft(page.getByText("Screen with camera")).toBeVisible();
  expect.soft(drift(seen.frames, "view")).toBeLessThan(1);
  expect.soft(blinks(seen.frames, "view")).toEqual([]);
  expect.soft(blinks(seen.frames, "swap")).toEqual([]);
  // A press on its buttons isn't a drag.
  expect.soft(seen.after.view?.box).toEqual(seen.before.view?.box);
});

test("F-small-view.6 Hide folds it into the corner button, which takes the focus", async ({ page }, info) => {
  await opened(page);
  const view = smallViewOf(page);
  const corner = page.getByRole("button", { name: "Show the small view" });
  const fullscreen = page.getByRole("button", { name: "Fullscreen" });
  const golive = page.getByRole("button", { name: "Go live" });
  await expect.soft(corner).toBeHidden();
  const seen = await observe(page, info, { view, corner, fullscreen, golive }, async () => {
    await page.getByRole("button", { name: "Hide the small view" }).click();
  });
  await expect.soft(view).toHaveCount(0);
  await expect.soft(corner).toBeVisible();
  const pic = await boxOf(pictureOf(page));
  const c = await boxOf(corner);
  expect.soft(inside(c, pic)).toBe(true);
  // In the picture's top-right corner: its right edge as far in as its top edge.
  expect.soft(Math.abs(pic.x + pic.width - (c.x + c.width) - (c.y - pic.y))).toBeLessThan(1);
  await expect.soft(corner).toBeFocused();
  expect.soft(drift(seen.frames, "fullscreen")).toBeLessThan(1);
  expect.soft(drift(seen.frames, "golive")).toBeLessThan(1);
  expect.soft(blinks(seen.frames, "fullscreen")).toEqual([]);
});

test("F-small-view.7 the corner button opens it where it was, the focus back on Hide", async ({ page }, info) => {
  await opened(page);
  const view = smallViewOf(page);
  await view.focus();
  await page.keyboard.press("ArrowLeft");
  const was = await boxOf(view);
  await page.getByRole("button", { name: "Hide the small view" }).click();
  const corner = page.getByRole("button", { name: "Show the small view" });
  await expect(corner).toBeVisible();
  await untilStill(stageOf(page));
  await observe(page, info, { view, corner }, async () => {
    await corner.click();
  });
  await expect.soft(view).toBeVisible();
  const now = await boxOf(view);
  expect.soft(Math.abs(now.x - was.x) + Math.abs(now.y - was.y)).toBeLessThan(1);
  await expect.soft(page.getByRole("button", { name: "Hide the small view" })).toBeFocused();
  await expect.soft(corner).toBeHidden();
});

test("F-small-view.8 its buttons fade with the stage's controls, the picture stays", async ({ page }, info) => {
  await opened(page);
  const view = smallViewOf(page);
  const swap = page.getByRole("button", { name: "Swap views" });
  const hide = page.getByRole("button", { name: "Hide the small view" });
  const fullscreen = page.getByRole("button", { name: "Fullscreen" });
  expect.soft(await shownOpacity(swap)).toBeGreaterThan(0.9);
  await observe(
    page,
    info,
    { view, swap, hide, fullscreen },
    async () => {
      // The mouse leaves the stage (to the window's bottom-left corner): the controls fade.
      await page.mouse.move(5, (await boxOf(page.locator("body"))).height - 5, { steps: 4 });
      await expect(chromeOf(page)).toHaveAttribute("data-chrome", "hidden");
      await untilStill(stageOf(page), { property: "opacity" });
    },
    { strip: 4, gap: 200 },
  );
  expect.soft(await shownOpacity(swap)).toBeLessThan(0.05);
  expect.soft(await shownOpacity(hide)).toBeLessThan(0.05);
  expect.soft(await shownOpacity(fullscreen)).toBeLessThan(0.05);
  expect.soft(await shownOpacity(view)).toBeGreaterThan(0.95);
  // Back over the stage, they come back with the others.
  await pointAt(page, pictureOf(page));
  await page.mouse.move(10, 10);
  await wakeStage(page);
  expect.soft(await shownOpacity(swap)).toBeGreaterThan(0.9);
});

test("F-small-view.9 on a picture too narrow for its buttons it folds by itself, leaving the focus", async ({
  page,
}, info) => {
  await opened(page);
  const view = smallViewOf(page);
  const corner = page.getByRole("button", { name: "Show the small view" });
  await observe(page, info, { view, corner }, async () => {
    await narrowPicture(page, 70);
  });
  await expect.soft(view).toHaveCount(0);
  await expect.soft(corner).toBeVisible();
  expect.soft(inside(await boxOf(corner), await boxOf(pictureOf(page)))).toBe(true);
  expect.soft(await focusedName(page)).toBe("");
  // Opened from its corner there, it stays open for this picture.
  await corner.click();
  await expect.soft(view).toBeVisible();
  // Nothing folds it again once its unfolding is over.
  await untilStill(stageOf(page));
  await expect.soft(view).toBeVisible();
});

import { expect, test } from "@playwright/test";
import { openScene } from "../support/open.ts";
import { observe } from "../support/observe.ts";
import { PHONE_TAG } from "../support/sizes.ts";

const LINE =
  "Sorry, Xovê doesn't work on phones or tablets yet. Open xove.app on your laptop or desktop to watch and share with your friends.";

test(`F-phone-notice.1 a phone gets the notice, whole on its screen ${PHONE_TAG}`, async ({ page }, info) => {
  await openScene(page, "s=live");
  const heading = page.getByRole("heading", { name: "See you on the big screen." });
  const seen = await observe(page, info, { heading, body: page.locator("body") }, async () => {
    await page.mouse.move(10, 10);
  });
  await expect.soft(heading).toBeVisible();
  await expect.soft(page.getByRole("link", { name: "Continue with Google" })).toHaveCount(0);
  // Nothing wider than the phone: no sideways scrolling.
  const wide = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect.soft(wide).toBeLessThanOrEqual(0);
  expect.soft(seen.after.heading?.visible).toBe(true);
});

test(`F-phone-notice.2 the mark, the drawn computer, the headline with big screen in red, and one line ${PHONE_TAG}`, async ({
  page,
}, info) => {
  await openScene(page, "s=live");
  const mark = page.getByRole("img", { name: "Xovê" });
  const heading = page.getByRole("heading", { level: 1, name: "See you on the big screen." });
  const line = page.getByText(LINE, { exact: true });
  const art = page.locator("main svg[aria-hidden=true]");
  await observe(page, info, { mark, art, heading, line }, async () => {
    await page.mouse.move(10, 10);
  });
  for (const l of [mark, art, heading, line]) await expect.soft(l).toBeInViewport({ ratio: 1 });
  await expect.soft(heading.locator("em")).toHaveText("big screen");
  await expect.soft(heading.locator("em")).toHaveCSS("color", "rgb(239, 75, 75)");
  await expect.soft(line.locator("code")).toHaveText("xove.app");
  await expect.soft(line.locator("code")).toHaveCSS("font-family", /IBM Plex Mono/);
  // Top to bottom: the mark, the computer, the headline, the line.
  const tops = await Promise.all([mark, art, heading, line].map(async (l) => (await l.boundingBox())?.y ?? 0));
  expect.soft([...tops].sort((a, b) => a - b)).toEqual(tops);
  // Centred across the screen.
  const box = await heading.boundingBox();
  const width = page.viewportSize()?.width ?? 0;
  expect.soft(Math.abs((box?.x ?? 0) + (box?.width ?? 0) / 2 - width / 2)).toBeLessThan(2);
});

test(`F-phone-notice.3 nothing of the app: no button, no link, no room, no sign-in ${PHONE_TAG}`, async ({
  page,
}, info) => {
  await openScene(page, "s=live");
  const heading = page.getByRole("heading", { name: "See you on the big screen." });
  await observe(page, info, { heading }, async () => {
    await page.mouse.move(10, 10);
  });
  await expect.soft(page.getByRole("button")).toHaveCount(0);
  await expect.soft(page.getByRole("link")).toHaveCount(0);
  await expect.soft(page.getByRole("region", { name: "Shared screen" })).toHaveCount(0);
  await expect.soft(page.getByRole("banner")).toHaveCount(0);
});

test(`F-phone-notice.4 every page gives a phone the same notice: sign-in, request access, admin ${PHONE_TAG}`, async ({
  page,
}, info) => {
  await openScene(page, "page=home");
  const heading = page.getByRole("heading", { name: "See you on the big screen." });
  await observe(page, info, { heading }, async () => {
    await page.mouse.move(10, 10);
  });
  await expect.soft(heading).toBeVisible();
  await expect.soft(page.getByRole("link", { name: "Continue with Google" })).toHaveCount(0);
  for (const q of ["page=request", "page=admin"]) {
    await openScene(page, q);
    await expect.soft(heading).toBeVisible();
    await expect.soft(page.getByRole("button")).toHaveCount(0);
  }
});

test(`F-phone-notice.5 a touch on the notice changes nothing ${PHONE_TAG}`, async ({ page }, info) => {
  await openScene(page, "s=live");
  const heading = page.getByRole("heading", { name: "See you on the big screen." });
  const mark = page.getByRole("img", { name: "Xovê" });
  const seen = await observe(page, info, { heading, mark }, async () => {
    const b = await heading.boundingBox();
    if (b) await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
  });
  expect.soft(seen.after.heading?.box).toEqual(seen.before.heading?.box);
  expect.soft(seen.after.mark?.box).toEqual(seen.before.mark?.box);
  await expect.soft(heading).toBeVisible();
});

import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";
import { blinks, drift } from "../support/frames.ts";
import { openScene } from "../support/open.ts";
import { observe } from "../support/observe.ts";

const ACCENT = "rgb(239, 75, 75)";
const PITCH = "Share your screen or camera in sharp, fast streams. Watch them play, hang out, help out. Invite only.";
const NOTE = "New here? Sign in and ask for access. The owner approves each person.";

/** Its box's top, to say what's above what. */
const top = async (l: Locator) => (await l.boundingBox())?.y ?? Number.NaN;

test("F-sign-in.1 signed out, Google's sign-in is on the screen and stays while pointed at", async ({ page }, info) => {
  await openScene(page, "page=home");
  const button = page.getByRole("link", { name: "Continue with Google" });
  const seen = await observe(page, info, { button }, async () => {
    const b = await button.boundingBox();
    if (b) await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 4 });
  });
  await expect.soft(button).toBeInViewport({ ratio: 1 });
  expect.soft(blinks(seen.frames, "button")).toEqual([]);
});

test("F-sign-in.2 the pitch: the mark, the headline with LIVE in red, its line and who can join", async ({
  page,
}, info) => {
  await openScene(page, "page=home");
  const mark = page.getByRole("img", { name: "Xovê" });
  const heading = page.getByRole("heading", { level: 1, name: "Go live with your friends." });
  const line = page.getByText(PITCH, { exact: true });
  const google = page.getByRole("link", { name: "Continue with Google" });
  const note = page.getByText(NOTE, { exact: true });
  await observe(page, info, { mark, heading, line, google, note }, async () => {
    await page.mouse.move(1, 1);
  });
  for (const l of [mark, heading, line, google, note]) await expect.soft(l).toBeVisible();
  const live = heading.locator("em");
  expect.soft(await live.evaluate((e) => (e as HTMLElement).innerText)).toBe("LIVE");
  await expect.soft(live).toHaveCSS("color", ACCENT);
  // One column, top to bottom: the mark, the headline, its line, the button, who can join.
  const tops = await Promise.all([mark, heading, line, google, note].map(top));
  expect.soft([...tops].sort((a, b) => a - b)).toEqual(tops);
  await expect.soft(page.getByRole("alert")).toHaveCount(0);
});

test("F-sign-in.3 Continue with Google lights a soft red ring when pointed at and sinks 1 px while pressed", async ({
  page,
}, info) => {
  await openScene(page, "page=home");
  const google = page.getByRole("link", { name: "Continue with Google" });
  await expect.soft(google).toHaveCSS("box-shadow", "none");
  const seen = await observe(page, info, { google }, async () => {
    await google.hover();
  });
  await expect.soft(google).toHaveCSS("box-shadow", /rgba\(239, 75, 75, 0\.14\)/);
  expect.soft(blinks(seen.frames, "google")).toEqual([]);
  expect.soft(drift(seen.frames, "google")).toBeLessThan(1);
  await page.mouse.down();
  await expect.soft(google).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 1)");
});

test("F-sign-in.4 the keyboard reaches Continue with Google first, with a red ring, and it leads to the API's Google sign-in", async ({
  page,
}, info) => {
  await openScene(page, "page=home");
  const google = page.getByRole("link", { name: "Continue with Google" });
  await observe(page, info, { google }, async () => {
    await page.keyboard.press("Tab");
  });
  await expect.soft(google).toBeFocused();
  await expect.soft(google).toHaveCSS("outline", `${ACCENT} solid 2px`);
  await expect.soft(google).toHaveAttribute("href", "/api/oauth2/authorization/google");
});

/** A sign-in error: its words, between the pitch's line and the button, on the screen. */
async function errorSays(page: Page, info: TestInfo, code: string, words: string) {
  await openScene(page, `page=home&error=${code}`);
  const alert = page.getByRole("alert");
  const line = page.getByText(PITCH, { exact: true });
  const google = page.getByRole("link", { name: "Continue with Google" });
  await observe(page, info, { alert, google }, async () => {
    await page.mouse.move(1, 1);
  });
  await expect.soft(alert).toHaveText(words);
  await expect.soft(alert).toBeInViewport();
  expect.soft(await top(line)).toBeLessThan(await top(alert));
  expect.soft(await top(alert)).toBeLessThan(await top(google));
  await expect.soft(google).toBeVisible();
}

test("F-sign-in.5 a failed Google sign-in says so, between the line and the button", async ({ page }, info) => {
  await errorSays(page, info, "login-failed", "Google sign-in didn't complete. Try again.");
});

test("F-sign-in.6 an unverified Google email says it can't be used", async ({ page }, info) => {
  await errorSays(
    page,
    info,
    "email-not-verified",
    "Your Google account's email isn't verified, so it can't be used here.",
  );
});

test("F-sign-in.7 any other sign-in error gets the general words", async ({ page }, info) => {
  await errorSays(page, info, "something-else", "Something went wrong signing you in. Try again.");
});

test("F-sign-in.8 the page's column is centred and never scrolls sideways", async ({ page }, info) => {
  await openScene(page, "page=home");
  const column = page.getByRole("region", { name: "Go live with your friends." });
  await observe(page, info, { column }, async () => {
    await page.mouse.move(1, 1);
  });
  const box = await column.boundingBox();
  const width = page.viewportSize()?.width ?? 0;
  expect.soft(Math.abs((box?.x ?? 0) + (box?.width ?? 0) / 2 - width / 2)).toBeLessThan(1);
  const wide = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect.soft(wide).toBeLessThanOrEqual(0);
});

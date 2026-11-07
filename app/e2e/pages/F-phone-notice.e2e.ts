import { expect, test } from "@playwright/test";
import { openScene } from "../support/open.ts";
import { observe } from "../support/observe.ts";
import { PHONE_TAG } from "../support/sizes.ts";

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

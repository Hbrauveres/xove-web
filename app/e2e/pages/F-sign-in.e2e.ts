import { expect, test } from "@playwright/test";
import { blinks } from "../support/frames.ts";
import { openScene } from "../support/open.ts";
import { observe } from "../support/observe.ts";

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

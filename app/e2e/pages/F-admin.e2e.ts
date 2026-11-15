import { expect, test, type Page } from "@playwright/test";
import { computed, LOOK } from "../support/looks.ts";
import { openScene } from "../support/open.ts";
import { observe } from "../support/observe.ts";

const requests = (page: Page) => page.getByRole("region", { name: /^Waiting for access/ });
const members = (page: Page) => page.getByRole("region", { name: /^Members/ });

test("F-admin.1 an admin sees who's waiting and who's in, under counted headings", async ({ page }, info) => {
  await openScene(page, "page=admin");
  const waiting = page.getByRole("heading", { level: 2, name: "Waiting for access 1" });
  const inside = page.getByRole("heading", { level: 2, name: "Members 1" });
  const back = page.getByRole("link", { name: "Back to the room" });
  await observe(page, info, { waiting, inside, back }, async () => {
    await page.mouse.move(1, 1);
  });
  const banner = page.getByRole("banner");
  await expect.soft(banner.getByRole("img", { name: "Xovê" })).toBeVisible();
  await expect.soft(banner).toContainText("admin");
  await expect.soft(back).toHaveAttribute("href", "/room");
  await expect.soft(waiting).toBeVisible();
  const request = requests(page).getByRole("listitem");
  await expect.soft(request).toContainText("Marina Costa");
  await expect.soft(request).toContainText("marina@example.com");
  // 90 minutes ago: in whole hours passed, rounded down.
  await expect.soft(request.locator("time")).toHaveText("1 h ago");
  await expect.soft(request).toContainText("“Hi, it's Marina from the Friday games.”");
  await expect.soft(request.getByRole("button", { name: "Approve" })).toBeEnabled();
  await expect.soft(request.getByRole("button", { name: "Decline" })).toBeEnabled();
  await expect.soft(inside).toBeVisible();
  const member = members(page).getByRole("listitem");
  await expect.soft(member).toContainText("Rafa Lima");
  await expect.soft(member).toContainText("rafa@example.com");
  await expect.soft(member.getByRole("button", { name: "Remove" })).toBeVisible();
  await expect
    .soft(page.getByText("Removing someone signs them out everywhere. They can ask for access again.", { exact: true }))
    .toBeVisible();
});

test("F-admin.2 Approve takes the request off the list, and the heading counts none", async ({ page }, info) => {
  await openScene(page, "page=admin");
  const approve = page.getByRole("button", { name: "Approve" });
  await observe(page, info, { approve }, async () => {
    await approve.click();
  });
  await expect.soft(page.getByText("No one is waiting right now.", { exact: true })).toBeVisible();
  await expect.soft(page.getByRole("heading", { level: 2, name: "Waiting for access 0" })).toBeVisible();
  await expect.soft(page.getByText("Marina Costa")).toHaveCount(0);
  await expect.soft(page.getByRole("alert")).toHaveCount(0);
  await expect.soft(members(page).getByRole("listitem")).toContainText("Rafa Lima");
});

test("F-admin.3 Decline takes the request off the list too", async ({ page }, info) => {
  await openScene(page, "page=admin");
  const decline = page.getByRole("button", { name: "Decline" });
  await observe(page, info, { decline }, async () => {
    await decline.click();
  });
  await expect.soft(page.getByText("No one is waiting right now.", { exact: true })).toBeVisible();
  await expect.soft(page.getByRole("heading", { level: 2, name: "Waiting for access 0" })).toBeVisible();
  await expect.soft(page.getByRole("alert")).toHaveCount(0);
});

test("F-admin.4 Remove asks first, with Remove Rafa and Cancel, and Cancel takes it back", async ({ page }, info) => {
  await openScene(page, "page=admin");
  const row = members(page).getByRole("listitem");
  const remove = row.getByRole("button", { name: "Remove", exact: true });
  await observe(page, info, { remove }, async () => {
    await remove.click();
  });
  await expect.soft(row.getByRole("button", { name: "Remove Rafa" })).toBeVisible();
  await expect.soft(row.getByRole("button", { name: "Cancel" })).toBeVisible();
  await expect.soft(row).toContainText("Rafa Lima");
  await row.getByRole("button", { name: "Cancel" }).click();
  await expect.soft(row.getByRole("button", { name: "Remove", exact: true })).toBeVisible();
  await expect.soft(row.getByRole("button", { name: "Remove Rafa" })).toHaveCount(0);
});

test("F-admin.5 confirming Remove Rafa takes him off the members", async ({ page }, info) => {
  await openScene(page, "page=admin");
  const row = members(page).getByRole("listitem");
  await row.getByRole("button", { name: "Remove", exact: true }).click();
  const confirm = row.getByRole("button", { name: "Remove Rafa" });
  await observe(page, info, { confirm }, async () => {
    await confirm.click();
  });
  await expect.soft(page.getByText("Rafa Lima")).toHaveCount(0);
  await expect.soft(page.getByRole("heading", { level: 2, name: "Members 0" })).toBeVisible();
  await expect.soft(page.getByRole("alert")).toHaveCount(0);
});

test("F-admin.6 Back to the room, a quiet link, takes the admin into the room", async ({ page }, info) => {
  await openScene(page, "page=admin");
  const back = page.getByRole("link", { name: "Back to the room" });
  await page.mouse.move(1, 1);
  await expect.soft(back).toHaveCSS("color", await computed(page, "color", LOOK.muted));
  await expect.soft(back).toHaveCSS("text-decoration-line", "none");
  await observe(page, info, { back }, async () => {
    await back.hover();
  });
  await expect.soft(back).toHaveCSS("text-decoration-line", "underline");
  await expect.soft(back).toHaveCSS("color", await computed(page, "color", LOOK.text));
  await back.click();
  await expect.soft(page.getByRole("region", { name: "Shared screen" })).toBeVisible();
  await expect.soft(page.getByRole("heading", { name: /^Waiting for access/ })).toHaveCount(0);
});

test("F-admin.7 an admin among the members says Admin in a solid red pill, and can't be removed", async ({
  page,
}, info) => {
  await openScene(page, "page=admin&withAdmin=1");
  const row = members(page).getByRole("listitem").filter({ hasText: "Bia Rocha" });
  await observe(page, info, { row }, async () => {
    await page.mouse.move(1, 1);
  });
  const badge = row.getByText("Admin", { exact: true });
  await expect.soft(badge).toHaveCSS("background-color", await computed(page, "background-color", LOOK.accent));
  await expect.soft(badge).toHaveCSS("color", await computed(page, "color", LOOK.accentInk));
  await expect.soft(row.getByRole("button")).toHaveCount(0);
  await expect.soft(page.getByRole("heading", { level: 2, name: "Members 2" })).toBeVisible();
});

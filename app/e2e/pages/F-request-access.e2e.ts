import { expect, test } from "@playwright/test";
import { blinks } from "../support/frames.ts";
import { openScene } from "../support/open.ts";
import { observe } from "../support/observe.ts";

const ASK = "Xovê is invite only. Ask for access and the owner will get your request.";
const SENT = "The owner has your request. Keep this page open: it moves you into the room as soon as you're approved.";

test("F-request-access.1 signed in without access: You need access, the form and who I'm signed in as", async ({
  page,
}, info) => {
  await openScene(page, "page=request");
  const heading = page.getByRole("heading", { level: 1, name: "You need access" });
  const message = page.getByRole("textbox", { name: "Message (optional)" });
  const send = page.getByRole("button", { name: "Request access" });
  const other = page.getByRole("button", { name: "Use another account" });
  await observe(page, info, { heading, message, send, other }, async () => {
    await page.mouse.move(1, 1);
  });
  await expect.soft(page.getByRole("img", { name: "Xovê" })).toBeVisible();
  await expect.soft(heading).toBeVisible();
  await expect.soft(page.getByText(ASK, { exact: true })).toBeVisible();
  await expect.soft(message).toHaveAttribute("placeholder", "Hey, it's me from…");
  await expect.soft(message).toHaveValue("");
  await expect.soft(page.getByText("0/500", { exact: true })).toBeVisible();
  await expect.soft(send).toBeEnabled();
  await expect.soft(page.getByText("Signed in as", { exact: true })).toBeVisible();
  await expect.soft(page.getByText("friend@example.com", { exact: true })).toBeVisible();
  await expect.soft(other).toBeVisible();
  for (const l of [heading, message, send, other]) await expect.soft(l).toBeInViewport();
});

test("F-request-access.2 typing a message counts its characters, up to 500", async ({ page }, info) => {
  await openScene(page, "page=request");
  const message = page.getByRole("textbox", { name: "Message (optional)" });
  await observe(page, info, { message }, async () => {
    await message.fill("Hi, it's Rafa");
  });
  await expect.soft(page.getByText("13/500", { exact: true })).toBeVisible();
  await message.fill("x".repeat(520));
  expect.soft((await message.inputValue()).length).toBe(500);
  await expect.soft(page.getByText("500/500", { exact: true })).toBeVisible();
});

test("F-request-access.3 Request access sends it and the page becomes Request sent, waiting for approval", async ({
  page,
}, info) => {
  await openScene(page, "page=request");
  const send = page.getByRole("button", { name: "Request access" });
  const other = page.getByRole("button", { name: "Use another account" });
  await page.getByRole("textbox", { name: "Message (optional)" }).fill("Hi, it's Rafa");
  const seen = await observe(page, info, { send, other }, async () => {
    await send.click();
  });
  await expect.soft(page.getByRole("heading", { level: 1, name: "Request sent" })).toBeVisible();
  await expect.soft(page.getByText(SENT, { exact: true })).toBeVisible();
  await expect.soft(page.getByRole("status")).toHaveText("Waiting for approval");
  await expect.soft(page.getByRole("textbox")).toHaveCount(0);
  await expect.soft(page.getByRole("alert")).toHaveCount(0);
  await expect.soft(other).toBeVisible();
  expect.soft(blinks(seen.frames, "other")).toEqual([]);
});

test("F-request-access.4 a request already sent shows Request sent, its dot pulsing, and no form", async ({
  page,
}, info) => {
  await openScene(page, "page=pending");
  const status = page.getByRole("status");
  await observe(page, info, { status }, async () => {
    await page.mouse.move(1, 1);
  });
  await expect.soft(page.getByRole("heading", { level: 1, name: "Request sent" })).toBeVisible();
  await expect.soft(page.getByText(SENT, { exact: true })).toBeVisible();
  await expect.soft(status).toHaveText("Waiting for approval");
  const dot = status.locator("span[aria-hidden]");
  await expect.soft(dot).toHaveCSS("animation-name", /pulse/);
  await expect.soft(dot).toHaveCSS("animation-duration", "1.6s");
  await expect.soft(page.getByRole("textbox")).toHaveCount(0);
  await expect.soft(page.getByRole("button", { name: "Request access" })).toHaveCount(0);
  await expect.soft(page.getByRole("button", { name: "Use another account" })).toBeVisible();
});

test("F-request-access.5 Use another account signs out and lands on the sign-in page", async ({ page }, info) => {
  await openScene(page, "page=request");
  const other = page.getByRole("button", { name: "Use another account" });
  await observe(page, info, { other }, async () => {
    await other.click();
  });
  await expect.soft(page.getByRole("link", { name: "Continue with Google" })).toBeVisible();
  await expect.soft(page.getByRole("heading", { level: 1, name: "Go live with your friends." })).toBeVisible();
  await expect.soft(page.getByText("friend@example.com")).toHaveCount(0);
});

test("F-request-access.6 the keyboard goes from the message to Request access to Use another account", async ({
  page,
}, info) => {
  await openScene(page, "page=request");
  const message = page.getByRole("textbox", { name: "Message (optional)" });
  const send = page.getByRole("button", { name: "Request access" });
  const other = page.getByRole("button", { name: "Use another account" });
  await observe(page, info, { message, send, other }, async () => {
    await page.keyboard.press("Tab");
  });
  await expect.soft(message).toBeFocused();
  await page.keyboard.press("Tab");
  await expect.soft(send).toBeFocused();
  await page.keyboard.press("Tab");
  await expect.soft(other).toBeFocused();
});

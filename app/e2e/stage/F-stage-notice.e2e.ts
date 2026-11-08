import { expect, test, type Page } from "@playwright/test";
import { observe } from "../support/observe.ts";
import { openScene } from "../support/open.ts";
import type { Box } from "../support/geometry.ts";
import { everyoneStops, marinaGoesLive, marinaGoesLiveSlowly } from "../support/harness.ts";
import { stageParts } from "./stage.ts";

// The harness's loading notice lasts a moment: the stream's video goes before the room's list says
// it stopped. Each moment it's on the stage is recorded from inside the page as it happens.
interface NoticeSeen {
  tag: string;
  title: string;
  text: string;
  spinner: boolean;
  box: Box;
  view: Box;
  chrome: string | null;
  titleCentre: number;
}

const recordNotices = (page: Page) =>
  page.evaluate(() => {
    const w = window as unknown as { __notices: unknown[] };
    w.__notices = [];
    const rect = (e: Element) => {
      const r = e.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    };
    const look = () => {
      const box = document.querySelector('section[aria-label="Shared screen"] > div');
      const layer = box?.querySelector("[data-on-picture]");
      const view = layer?.previousElementSibling;
      const notice = view?.querySelector("output");
      if (!box || !view || !notice) return;
      const [title, text] = [...notice.querySelectorAll("p")].map((p) => p.textContent ?? "");
      const t = notice.querySelector("p")?.getBoundingClientRect();
      w.__notices.push({
        tag: notice.tagName,
        title: title ?? "",
        text: text ?? "",
        spinner: notice.querySelector('span[aria-hidden="true"]') !== null,
        box: rect(notice),
        view: rect(view),
        chrome: box.firstElementChild?.getAttribute("data-chrome") ?? null,
        titleCentre: t ? t.x + t.width / 2 : 0,
      });
    };
    new MutationObserver(look).observe(document.body, { subtree: true, childList: true, attributes: true });
  });
const notices = (page: Page) => page.evaluate(() => (window as unknown as { __notices: NoticeSeen[] }).__notices);

/** The empty stage, then Marina starts sharing, her video on its way for a moment, until it plays. */
async function loadingMoment(page: Page, info: Parameters<typeof observe>[1]): Promise<NoticeSeen[]> {
  await openScene(page, "s=empty");
  await recordNotices(page);
  // The strip spread over the whole start (the room's poll, then the video's wait), so the notice is pictured.
  await observe(
    page,
    info,
    { view: stageParts(page).view },
    async () => {
      await marinaGoesLiveSlowly(page);
      // Until her picture plays: the notice has come and gone.
      await stageParts(page).box.getByLabel("Marina's shared screen").waitFor();
    },
    { strip: 10, gap: 500 },
  );
  return notices(page);
}

test("F-stage-notice.1 while a stream starts, its video on its way, the stage says Loading Marina's screen…", async ({
  page,
}, info) => {
  const seen = await loadingMoment(page, info);
  expect.soft(seen.length).toBeGreaterThan(0);
  const first = seen[0];
  expect.soft(first?.title).toBe("Loading Marina's screen…");
  expect.soft(first?.text).toBe("The video starts in a moment.");
  expect.soft(first?.spinner).toBe(true);
});

test("F-stage-notice.2 the notice covers the stage's picture, its words centred on it", async ({ page }, info) => {
  const seen = await loadingMoment(page, info);
  const first = seen[0];
  expect.soft(first).toBeTruthy();
  if (!first) return;
  expect
    .soft(Math.abs(first.box.width - first.view.width) + Math.abs(first.box.height - first.view.height))
    .toBeLessThan(1);
  expect.soft(Math.abs(first.titleCentre - (first.view.x + first.view.width / 2))).toBeLessThan(2);
});

test("F-stage-notice.3 a notice never fades with the controls, and a screen reader hears it", async ({
  page,
}, info) => {
  const seen = await loadingMoment(page, info);
  expect.soft(seen.length).toBeGreaterThan(0);
  // No fading state while it's there: the controls stay as they are.
  expect.soft(seen.map((s) => s.chrome).filter((c) => c !== null)).toEqual([]);
  // An output: announced as a status.
  expect.soft(seen.every((s) => s.tag === "OUTPUT")).toBe(true);
});

test("F-stage-notice.4 when someone stops, the stage goes straight to its empty state, never Loading…", async ({
  page,
}, info) => {
  await openScene(page, "s=live");
  await recordNotices(page);
  await observe(page, info, { view: stageParts(page).view }, async () => {
    await everyoneStops(page);
    await page.getByRole("heading", { name: "Go live" }).waitFor();
  });
  // On no frame between the stream and the empty stage did a notice show.
  expect.soft(await notices(page)).toEqual([]);
  await expect.soft(stageParts(page).view.locator("output")).toHaveCount(0);
  await expect.soft(page.getByRole("heading", { name: "Go live" })).toBeVisible();
});

test("F-stage-notice.5 a stream that starts plays without a notice once its video is there", async ({ page }, info) => {
  await openScene(page, "s=empty");
  await recordNotices(page);
  const marina = stageParts(page).box.getByLabel("Marina's shared screen");
  await observe(page, info, { view: stageParts(page).view }, async () => {
    await marinaGoesLive(page);
    await marina.waitFor();
  });
  await expect.soft(marina).toBeVisible();
  await expect.soft(stageParts(page).view.locator("output")).toHaveCount(0);
});

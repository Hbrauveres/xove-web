// What the room's cases share: the page's three parts, pointing at a control, the harness's people
// starting and stopping, and the seat the API answers (the queue, an offer, the API unreachable),
// played by answering the page's own requests for a seat before the fake API does.
import type { Locator, Page } from "@playwright/test";
import { FIXED_TIME } from "../support/open.ts";

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A locator's box, or a zero box where it isn't. */
export async function boxOf(locator: Locator): Promise<Box> {
  return (await locator.first().boundingBox()) ?? { x: 0, y: 0, width: 0, height: 0 };
}

/** Whether `inner` lies inside `outer` (half a pixel's rounding allowed). */
export const inside = (outer: Box, inner: Box) =>
  inner.x >= outer.x - 0.5 &&
  inner.y >= outer.y - 0.5 &&
  inner.x + inner.width <= outer.x + outer.width + 0.5 &&
  inner.y + inner.height <= outer.y + outer.height + 0.5;

/** Whether two boxes share any area. */
export const overlap = (a: Box, b: Box) =>
  a.x < b.x + b.width - 0.5 && b.x < a.x + a.width - 0.5 && a.y < b.y + b.height - 0.5 && b.y < a.y + a.height - 0.5;

export const centreX = (b: Box) => b.x + b.width / 2;
export const centreY = (b: Box) => b.y + b.height / 2;

/** The window as a box. */
export const windowBox = (page: Page): Box => ({ x: 0, y: 0, ...page.viewportSize()! });

/** The room's parts: the header, the middle with the stage, and the footer. */
export function roomOf(page: Page) {
  return {
    header: page.getByRole("banner"),
    middle: page.getByRole("main"),
    stage: page.getByRole("region", { name: "Shared screen" }),
    footer: page.getByRole("contentinfo"),
  };
}

/** The mouse moved onto the middle of `locator`, in a few steps, as a hand would. */
export async function pointAt(page: Page, locator: Locator, steps = 3): Promise<void> {
  const b = await boxOf(locator);
  await page.mouse.move(centreX(b), centreY(b), { steps });
}

type Xove = { __xove: { everyoneStops: () => void; marinaGoesLive: () => void } };
export const everyoneStops = (page: Page) => page.evaluate(() => (window as unknown as Xove).__xove.everyoneStops());
export const marinaGoesLive = (page: Page) => page.evaluate(() => (window as unknown as Xove).__xove.marinaGoesLive());

/** What the API answers when the page asks for a seat. */
export type Seat =
  | { status: "in" }
  | { status: "waiting"; place: number }
  | { status: "offered"; until: string; seconds: number }
  /** The API can't be reached: the request fails. */
  | "down";

/** A seat offered for 60 seconds from the tests' fixed moment. */
export const OFFER: Seat = {
  status: "offered",
  until: new Date(FIXED_TIME.getTime() + 60_000).toISOString(),
  seconds: 60,
};

/**
 * From now on, the page's requests for a seat get `seat`: entering is answered with it, and
 * "Enter room" on an offer takes the seat (then entering answers "in"). Everything else still goes
 * to the harness's fake API. The new answer arrives with the page's next poll (every 2 s).
 */
export async function answerSeat(page: Page, seat: Seat): Promise<void> {
  await page.evaluate((seat) => {
    type Hook = { seat: unknown };
    const w = window as unknown as { __seat?: Hook };
    if (!w.__seat) {
      const hook: Hook = { seat };
      w.__seat = hook;
      const real = window.fetch;
      const json = (body: unknown) =>
        new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const path = String(input);
        const post = init?.method === "POST";
        if (post && path === "/api/room/enter") {
          if (hook.seat === "down") throw new TypeError("Failed to fetch");
          return json(hook.seat);
        }
        if (post && path === "/api/room/accept" && (hook.seat as { status?: string }).status === "offered") {
          hook.seat = { status: "in" };
          return json(hook.seat);
        }
        return real(input, init);
      };
    }
    w.__seat.seat = seat;
  }, seat);
}

/** The time on the page's clock moved on by `ms` from the tests' fixed moment. */
export const clockAt = (page: Page, ms: number) => page.clock.setFixedTime(new Date(FIXED_TIME.getTime() + ms));

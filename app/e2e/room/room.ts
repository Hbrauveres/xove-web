// What the room's cases share, beyond support/: the page's three parts, and the seat the API
// answers (the queue, an offer, the API unreachable), played by answering the page's own requests
// for a seat before the fake API does.
import type { Page } from "@playwright/test";
import { FIXED_TIME } from "../support/open.ts";
import { stageOf } from "../support/stage.ts";

/** Long enough for the room's next poll (every 2 s, the app's POLL_MS) and its answer to show. */
export const AFTER_POLL = { timeout: 4000 };

/** The room's parts: the header, the middle with the stage, and the footer. */
export function roomOf(page: Page) {
  return {
    header: page.getByRole("banner"),
    middle: page.getByRole("main"),
    stage: stageOf(page),
    footer: page.getByRole("contentinfo"),
  };
}

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

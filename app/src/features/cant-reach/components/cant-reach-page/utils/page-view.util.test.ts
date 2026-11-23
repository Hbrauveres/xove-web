import { describe, expect, it } from "vitest";
import { CANT_REACH, FAILED, FAILED_LINE, GAVE_UP, TRYING_NOW } from "../constants/cant-reach.constants";
import { pageView } from "./page-view.util";

describe("what the page shows", () => {
  it("out of reach: the time to the next try, then trying, with the status and nothing to press", () => {
    expect(pageView({ status: "unreachable", nextTryAt: 9_000 }, 1_000)).toEqual({
      headline: CANT_REACH,
      line: "Trying again in 8 s.",
      action: "reconnecting",
    });
    expect(pageView({ status: "unreachable", nextTryAt: 9_000 }, 9_000)).toMatchObject({ line: TRYING_NOW });
  });

  it("stopped: says so, with Try again", () => {
    expect(pageView({ status: "unreachable", nextTryAt: null }, 0)).toEqual({
      headline: CANT_REACH,
      line: GAVE_UP,
      action: "tryAgain",
    });
  });

  it("failed: Try again, or Please wait while it tries", () => {
    expect(pageView({ status: "failed", busy: false }, 0)).toEqual({
      headline: FAILED,
      line: FAILED_LINE,
      action: "tryAgain",
    });
    expect(pageView({ status: "failed", busy: true }, 0)).toMatchObject({ action: "pleaseWait" });
  });
});

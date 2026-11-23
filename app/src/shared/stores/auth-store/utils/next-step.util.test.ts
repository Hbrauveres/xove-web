import { describe, expect, it } from "vitest";
import { ApiError, SIGNED_OUT_STATUS } from "@services/xove-api-service";
import { RETRY_COOLDOWN_MS, RETRY_DELAYS_MS } from "../constants/auth-check.constants";
import { nextStep } from "./next-step.util";

const NOW = 1_000;
const noAnswer = () => new TypeError("Failed to fetch");

describe("what follows a failed check of who's signed in", () => {
  it("signs out on the API's 'nobody is signed in', and waits for nothing", () => {
    expect(nextStep(new ApiError(SIGNED_OUT_STATUS, "x"), 0, false, NOW)).toEqual({ state: { status: "signedOut" } });
  });

  it("out of reach, tries again after this round's next wait, and stops once the waits run out", () => {
    for (const [tries, wait] of RETRY_DELAYS_MS.entries())
      expect(nextStep(noAnswer(), tries, false, NOW)).toEqual({
        state: { status: "unreachable", nextTryAt: NOW + wait },
        wait: { ms: wait, then: "tryAgain" },
      });
    expect(nextStep(noAnswer(), RETRY_DELAYS_MS.length, false, NOW)).toEqual({
      state: { status: "unreachable", nextTryAt: null },
    });
  });

  it("failed, awaits a press; after a pressed try, holds the next press off for a moment", () => {
    const failed = new ApiError(500, "x");
    expect(nextStep(failed, 0, false, NOW)).toEqual({ state: { status: "failed", busy: false }, wait: undefined });
    expect(nextStep(failed, 0, true, NOW)).toEqual({
      state: { status: "failed", busy: true },
      wait: { ms: RETRY_COOLDOWN_MS, then: "endCooldown" },
    });
  });
});

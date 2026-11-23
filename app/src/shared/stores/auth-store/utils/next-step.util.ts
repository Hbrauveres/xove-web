import { RETRY_COOLDOWN_MS, RETRY_DELAYS_MS } from "../constants/auth-check.constants";
import type { NextStep } from "../types/next-step.types";
import { checkOutcome } from "./check-outcome.util";

/**
 * What follows a failed check: signed out; out of reach, the next try after this round's next wait (or
 * stopped once the waits run out); failed, a press awaited, and after a pressed try a moment before the
 * next press counts. `tries`: the retries this round has used; `pressed`: a person asked for this try.
 */
export function nextStep(error: unknown, tries: number, pressed: boolean, now: number): NextStep {
  const outcome = checkOutcome(error);
  if (outcome === "signedOut") return { state: { status: "signedOut" } };
  if (outcome === "failed")
    return {
      state: { status: "failed", busy: pressed },
      wait: pressed ? { ms: RETRY_COOLDOWN_MS, then: "endCooldown" } : undefined,
    };
  const next = RETRY_DELAYS_MS[tries];
  if (next === undefined) return { state: { status: "unreachable", nextTryAt: null } };
  return { state: { status: "unreachable", nextTryAt: now + next }, wait: { ms: next, then: "tryAgain" } };
}

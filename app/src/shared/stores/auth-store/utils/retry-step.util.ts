import type { AuthState } from "../types/auth.types";
import type { RetryStep } from "../types/retry-step.types";

/**
 * What a press of Try again does: once the retries stopped, a new round (trying now); after a failure,
 * one pressed try (busy until it ends); anything else, nothing.
 */
export function retryStep(state: AuthState, now: number): RetryStep | null {
  if (state.status === "unreachable" && state.nextTryAt === null)
    return { state: { status: "unreachable", nextTryAt: now }, pressed: false };
  if (state.status === "failed" && !state.busy) return { state: { status: "failed", busy: true }, pressed: true };
  return null;
}

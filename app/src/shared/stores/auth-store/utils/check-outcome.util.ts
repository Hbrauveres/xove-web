import { ApiError, SIGNED_OUT_STATUS } from "@services/xove-api-service";
import { UNREACHABLE_STATUSES } from "../constants/auth-check.constants";
import type { CheckOutcome } from "../types/auth.types";

/**
 * What a failed check of who's signed in means. Only the API's "nobody is signed in" signs out; no
 * answer, a timeout or the proxy saying the API is down is out of reach; anything else is a failure.
 * The error stays here: nothing about it reaches the page.
 */
export function checkOutcome(error: unknown): CheckOutcome {
  if (error instanceof ApiError) {
    if (error.status === SIGNED_OUT_STATUS) return "signedOut";
    return UNREACHABLE_STATUSES.includes(error.status) ? "unreachable" : "failed";
  }
  // fetch fails with a TypeError when nothing answers; an aborted or timed-out wait is a DOMException.
  if (error instanceof TypeError || error instanceof DOMException) return "unreachable";
  return "failed";
}

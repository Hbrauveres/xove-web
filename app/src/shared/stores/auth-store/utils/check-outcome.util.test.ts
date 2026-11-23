import { describe, expect, it } from "vitest";
import { ApiError, SIGNED_OUT_STATUS } from "@services/xove-api-service";
import { UNREACHABLE_STATUSES } from "../constants/auth-check.constants";
import { checkOutcome } from "./check-outcome.util";

const answered = (status: number) => new ApiError(status, "some words");

describe("what a failed check of who's signed in means", () => {
  it("is signed out only when the API says nobody is signed in", () => {
    expect(checkOutcome(answered(SIGNED_OUT_STATUS))).toBe("signedOut");
  });

  it("is out of reach with no answer, a timeout, or the proxy saying the API is down", () => {
    expect(checkOutcome(new TypeError("Failed to fetch"))).toBe("unreachable");
    expect(checkOutcome(new DOMException("too long", "TimeoutError"))).toBe("unreachable");
    expect(checkOutcome(new DOMException("aborted", "AbortError"))).toBe("unreachable");
    for (const status of UNREACHABLE_STATUSES) expect(checkOutcome(answered(status))).toBe("unreachable");
  });

  it("is a failure for any other answer, or one it can't read", () => {
    for (const status of [500, 403, 404, 429, 418]) expect(checkOutcome(answered(status))).toBe("failed");
    expect(checkOutcome(new SyntaxError("Unexpected token"))).toBe("failed");
  });
});

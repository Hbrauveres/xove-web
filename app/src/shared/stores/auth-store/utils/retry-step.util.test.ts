import { describe, expect, it } from "vitest";
import { retryStep } from "./retry-step.util";

describe("what a press of Try again does", () => {
  it("once the retries stopped, starts a new round, trying now", () => {
    expect(retryStep({ status: "unreachable", nextTryAt: null }, 5_000)).toEqual({
      state: { status: "unreachable", nextTryAt: 5_000 },
      pressed: false,
    });
  });

  it("after a failure, starts one pressed try, busy until it ends", () => {
    expect(retryStep({ status: "failed", busy: false }, 0)).toEqual({
      state: { status: "failed", busy: true },
      pressed: true,
    });
  });

  it("does nothing while retries run, while a pressed try is busy, or with an answer", () => {
    expect(retryStep({ status: "unreachable", nextTryAt: 9_000 }, 0)).toBeNull();
    expect(retryStep({ status: "failed", busy: true }, 0)).toBeNull();
    expect(retryStep({ status: "signedOut" }, 0)).toBeNull();
  });
});

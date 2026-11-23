import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { onFakeClock } from "../../../../testing/factories/clock.factory";
import { aUser, installFakeApi } from "../../../../testing/fakes/api.fake";
import { CHECK_TIMEOUT_MS, RETRY_COOLDOWN_MS, RETRY_DELAYS_MS } from "../constants/auth-check.constants";
import { useWhoCheck } from "./use-who-check.hook";

const ME = "GET /api/me";
/** Lets the fake clock run `ms` on, and what was waiting on it happen. */
const pass = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));
const checks = (server: ReturnType<typeof installFakeApi>) =>
  server.calls.filter((c) => c.method === "GET" && c.path === "/api/me").length;

describe("checking who's signed in, and trying again", () => {
  it("tries again after 2, 4, 8, 16, 30 and 30 s while the API can't be reached, then stops", async () => {
    onFakeClock();
    const server = installFakeApi({ me: aUser() });
    server.unreachable.add(ME);
    const { result } = renderHook(() => useWhoCheck());
    await pass(0);
    expect(checks(server)).toBe(1);

    for (const [i, wait] of RETRY_DELAYS_MS.entries()) {
      expect(result.current.state).toEqual({ status: "unreachable", nextTryAt: Date.now() + wait });
      await pass(wait - 1);
      expect(checks(server)).toBe(i + 1);
      await pass(1);
      expect(checks(server)).toBe(i + 2);
    }
    expect(result.current.state).toEqual({ status: "unreachable", nextTryAt: null });
    await pass(10 * 60_000);
    expect(checks(server)).toBe(RETRY_DELAYS_MS.length + 1);
  });

  it("counts a check that hangs as no answer once it has waited long enough", async () => {
    onFakeClock();
    const server = installFakeApi({ me: aUser() });
    server.hanging.add(ME);
    const { result } = renderHook(() => useWhoCheck());
    await pass(CHECK_TIMEOUT_MS - 1);
    expect(result.current.state.status).toBe("loading");
    await pass(1);
    expect(result.current.state.status).toBe("unreachable");
  });

  it("goes on as soon as a try gets an answer", async () => {
    onFakeClock();
    const server = installFakeApi({ me: aUser({ email: "ana@example.com" }) });
    server.unreachable.add(ME);
    const { result } = renderHook(() => useWhoCheck());
    await pass(0);
    await pass(RETRY_DELAYS_MS[0] ?? 0);
    server.unreachable.clear();
    await pass(RETRY_DELAYS_MS[1] ?? 0);
    expect(result.current.state).toMatchObject({ status: "signedIn", me: { email: "ana@example.com" } });
  });

  it("can't be made to try sooner while it waits; once it stopped, a press starts a new round", async () => {
    onFakeClock();
    const server = installFakeApi({ me: aUser() });
    server.unreachable.add(ME);
    const { result } = renderHook(() => useWhoCheck());
    await pass(0);
    act(() => result.current.retry());
    act(() => result.current.retry());
    await pass(0);
    expect(checks(server)).toBe(1);

    await pass(RETRY_DELAYS_MS.reduce((a, b) => a + b, 0));
    const stopped = checks(server);
    act(() => result.current.retry());
    await pass(0);
    expect(checks(server)).toBe(stopped + 1);
    expect(result.current.state).toEqual({ status: "unreachable", nextTryAt: Date.now() + (RETRY_DELAYS_MS[0] ?? 0) });
  });

  it("on a failure, tries once a press, ignores presses while it tries and for a while after it fails again", async () => {
    onFakeClock();
    const server = installFakeApi({ me: aUser() });
    server.failures.set(ME, { status: 500 });
    const { result } = renderHook(() => useWhoCheck());
    await pass(0);
    expect(result.current.state).toEqual({ status: "failed", busy: false });

    act(() => result.current.retry());
    act(() => result.current.retry());
    expect(result.current.state).toEqual({ status: "failed", busy: true });
    await pass(0);
    expect(checks(server)).toBe(2);

    await pass(RETRY_COOLDOWN_MS - 1);
    act(() => result.current.retry());
    await pass(0);
    expect(checks(server)).toBe(2);
    expect(result.current.state).toEqual({ status: "failed", busy: true });
    await pass(1);
    expect(result.current.state).toEqual({ status: "failed", busy: false });
  });

  it("signs out on the API's 'nobody is signed in', and stops trying once it's gone", async () => {
    onFakeClock();
    const out = installFakeApi({ me: null });
    const signedOut = renderHook(() => useWhoCheck());
    await pass(0);
    expect(signedOut.result.current.state).toEqual({ status: "signedOut" });
    signedOut.unmount();

    const server = installFakeApi({ me: aUser() });
    server.unreachable.add(ME);
    const { unmount } = renderHook(() => useWhoCheck());
    await pass(0);
    unmount();
    await pass(60_000);
    expect(checks(server)).toBe(1);
    void out;
  });
});
